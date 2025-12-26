// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AdminMessage = require('../models/AdminMessage');
const DepartmentStats = require('../models/DepartmentStats');
const User = require('../models/User');
const Message = require('../models/Message');
const Submission = require('../models/Submission');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_123456';

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided',
      error: 'Authorization header missing or malformed'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      error: err.message
    });
  }
};

// Middleware: Verify Admin Role (must come after verifyToken)
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      userRole: req.user?.role || 'unknown'
    });
  }
  next();
};

// =====================
// ADMIN MESSAGE ROUTES
// =====================

/**
 * GET /api/admin/health
 * Simple health check endpoint
 */
router.get('/health', (req, res) => {
  console.log('🏥 [health] Received health check request');
  res.json({ success: true, message: 'Admin routes are operational' });
});

/**
 * GET /api/admin/diagnostics
 * Diagnostic endpoint to check system state (admin only)
 */
router.get('/diagnostics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log('🔍 [diagnostics] Running system diagnostics...');
    
    // Count staff members by role
    const staffByRole = await User.aggregate([
      { $match: { role: { $in: ['library', 'transport', 'laboratory', 'feedepartment', 'coordination', 'studentservice'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count messages by recipient_department
    const messagesByDept = await Message.aggregate([
      { $group: { _id: '$recipient_department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count messages by recipient_id
    const messagesByRecipient = await Message.countDocuments({ recipient_id: { $exists: true, $ne: null } });
    
    // Count messages by type
    const messagesByType = await Message.aggregate([
      { $group: { _id: '$message_type', count: { $sum: 1 } } }
    ]);
    
    // Get total messages
    const totalMessages = await Message.countDocuments();
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get sample messages
    const sampleMessages = await Message.find().limit(5).lean();

    res.json({
      success: true,
      data: {
        staffByRole,
        messagesByDept,
        messagesByRecipient,
        messagesByType,
        totalMessages,
        totalUsers,
        sampleMessages: sampleMessages.map(m => ({
          _id: m._id,
          subject: m.subject,
          sender_name: m.sender_name,
          recipient_id: m.recipient_id,
          recipient_department: m.recipient_department,
          message_type: m.message_type,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Diagnostics Error:', error);
    res.status(500).json({ success: false, message: 'Diagnostics failed', error: error.message });
  }
});

/**
 * POST /api/admin/send-message
 * Send message to departments, staff roles, or students
 */
router.post('/send-message', verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log('📤 [send-message] Received request');
    const { messageType, targetType, department, studentSapId, roleTarget, subject, message, priority } = req.body;

    // Validation
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (messageType === 'department' && targetType === 'specific' && !department) {
      return res.status(400).json({
        success: false,
        message: 'Department must be specified'
      });
    }

    if (messageType === 'student' && !studentSapId) {
      return res.status(400).json({
        success: false,
        message: 'Student SAP ID is required'
      });
    }

    if (messageType === 'role' && !roleTarget) {
      return res.status(400).json({
        success: false,
        message: 'Role target is required'
      });
    }

    console.log('✅ [send-message] Validation passed, messageType:', messageType);

    // Create admin message record
    const adminMessage = new AdminMessage({
      sender: {
        id: req.user.id,
        name: req.user.full_name,
        email: req.user.email,
        role: req.user.role
      },
      messageType,
      targetType: messageType === 'department' ? targetType : messageType === 'role' ? 'broadcast' : undefined,
      recipientDepartment: messageType === 'department' ? department : undefined,
      recipientRole: messageType === 'role' ? roleTarget : undefined,
      recipientSapId: messageType === 'student' ? studentSapId : undefined,
      subject,
      message,
      priority: priority || 'normal',
      status: 'sent'
    });

    await adminMessage.save();
    console.log('✅ [send-message] AdminMessage saved');

    // Track users for response
    let usersToNotify = [];

    // Handle department messages
    if (messageType === 'department') {
      let departmentUsers = [];
      let departmentName = '';

      if (targetType === 'all') {
        // Get all non-student, non-hod users (case-insensitive)
        // Match department staff: Library, Transport, Laboratory, etc.
        console.log('🔍 [send-message] Finding all department users...');
        departmentUsers = await User.find({
          role: {
            $regex: /^(library|transport|laboratory|feedepartment|coordination|studentservice)$/i
          }
        });
        console.log('✅ [send-message] Found', departmentUsers.length, 'department users');
      } else if (targetType === 'specific') {
        // Get users from specific department (case-insensitive)
        let roleFilter = '';
        
        console.log('🔍 [send-message] Finding users for department:', department);

        if (department === 'Library') {
          roleFilter = /^library$/i;
        } else if (department === 'Transport') {
          roleFilter = /^transport$/i;
        } else if (department === 'Laboratory') {
          roleFilter = /^laboratory$/i;
        } else if (department === 'Fee Department') {
          roleFilter = /^feedepartment$/i;
        } else if (department === 'Coordination') {
          roleFilter = /^coordination$/i;
        } else if (department === 'Student Services') {
          roleFilter = /^studentservice$/i;
        } else {
          console.log('❌ [send-message] Invalid department:', department);
          return res.status(400).json({
            success: false,
            message: 'Invalid department'
          });
        }

        departmentName = department;
        console.log('🔍 [send-message] Using roleFilter:', roleFilter);
        departmentUsers = await User.find({ role: roleFilter });
        console.log('✅ [send-message] Found', departmentUsers.length, 'users for', department);
      }

      usersToNotify = departmentUsers;

      // Create messages for each department user with correct field names
      const departmentMessages = departmentUsers.map(user => ({
        sender_id: req.user.id,
        sender_name: req.user.full_name,
        sender_role: req.user.role,
        sender_sapid: req.user.sap,
        recipient_id: user._id,
        recipient_sapid: user.sap,
        recipient_department: user.role,
        subject: `[ADMIN REMINDER] ${subject}`,
        message,
        message_type: 'notification',
        status: 'Pending',
        is_read: false,
        createdAt: new Date()
      }));

      if (departmentMessages.length > 0) {
        const createdMessages = await Message.insertMany(departmentMessages);
        console.log(`✅ [send-message] Created ${createdMessages.length} messages for ${departmentMessages.length} department users`);
        if (createdMessages.length > 0) {
          console.log('📧 Sample message:', JSON.stringify(createdMessages[0], null, 2));
        }

        // Update department stats if specific department
        if (departmentName) {
          await DepartmentStats.findOneAndUpdate(
            { departmentName },
            {
              $inc: { totalRequests: departmentMessages.length },
              lastUpdated: new Date(),
              updatedBy: {
                id: req.user.id,
                name: req.user.full_name,
                email: req.user.email
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // Handle role-based broadcast messages
    if (messageType === 'role') {
      // Get all users with the specified role (case-insensitive)
      const roleUsers = await User.find({ role: new RegExp(`^${roleTarget}$`, 'i') });

      if (roleUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No staff members found with role: ${roleTarget}`
        });
      }

      usersToNotify = roleUsers;

      // Create messages for each staff member with the role - using correct field names
      const roleMessages = roleUsers.map(user => ({
        sender_id: req.user.id,
        sender_name: req.user.full_name,
        sender_role: req.user.role,
        sender_sapid: req.user.sap,
        recipient_id: user._id,
        recipient_sapid: user.sap,
        recipient_department: user.role,
        subject: `[ADMIN BROADCAST] ${subject}`,
        message,
        message_type: 'notification',
        status: 'Pending',
        is_read: false,
        createdAt: new Date()
      }));

      if (roleMessages.length > 0) {
        const createdRoleMessages = await Message.insertMany(roleMessages);
        console.log(`✅ [send-message] Created ${createdRoleMessages.length} role-based broadcast messages to ${roleUsers.length} staff`);
        if (createdRoleMessages.length > 0) {
          console.log('📧 Sample role message:', JSON.stringify(createdRoleMessages[0], null, 2));
        }
      } else {
        console.log(`⚠️ [send-message] No role messages created - checked ${roleUsers.length} users with role: ${roleTarget}`);
      }
    }

    // Handle student messages
    if (messageType === 'student') {
      const student = await User.findOne({ sap: studentSapId });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found with SAP ID: ' + studentSapId
        });
      }

      const studentMessage = new Message({
        sender_id: req.user.id,
        sender_name: req.user.full_name,
        sender_role: req.user.role,
        sender_sapid: req.user.sap,
        recipient_id: student._id,
        recipient_sapid: student.sap,
        recipient_department: student.department,
        subject,
        message,
        message_type: 'notification',
        status: 'Pending',
        is_read: false,
        createdAt: new Date()
      });

      await studentMessage.save();
    }

    // Track recipient count
    let recipientCount = 1; // Default for student messages
    let recipientDescription = 'student';

    if (messageType === 'department') {
      recipientCount = usersToNotify?.length || 0;
      recipientDescription = 'department staff members';
    } else if (messageType === 'role') {
      recipientCount = usersToNotify?.length || 0;
      recipientDescription = `staff members with role: ${roleTarget}`;
    }

    res.json({
      success: true,
      message: `✅ Message sent successfully to ${recipientCount} ${recipientDescription}`,
      data: {
        messageId: adminMessage._id,
        messageType,
        recipientCount,
        timestamp: adminMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/messages
 * Get all admin messages
 */
router.get('/messages', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, messageType } = req.query;

    const filter = {};
    if (messageType) filter.messageType = messageType;

    const messages = await AdminMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdminMessage.countDocuments(filter);

    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// =====================
// DEPARTMENT STATS ROUTES
// =====================

/**
 * GET /api/admin/department-stats
 * Get statistics for all departments (real-time progress tracking)
 * Calculates stats directly from Submission collection for real-time data
 */
router.get('/department-stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const departments = [
      { name: 'Library', role: 'library' },
      { name: 'Transport', role: 'transport' },
      { name: 'Laboratory', role: 'laboratory' },
      { name: 'Fee & Dues', role: 'feedepartment' },
      { name: 'Coordination Office', role: 'coordination' },
      { name: 'Student Services', role: 'studentservice' }
    ];

    // Get real-time stats directly from Submission collection using aggregation pipeline
    const submissionStats = await Submission.aggregate([
      {
        $group: {
          _id: '$department',
          totalRequests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inReview: { $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          totalRequests: 1,
          approved: 1,
          rejected: 1,
          pending: 1,
          inReview: 1
        }
      },
      { $sort: { department: 1 } }
    ]);

    // Create a map for quick lookup
    const statsMap = {};
    submissionStats.forEach(stat => {
      statsMap[stat.department] = stat;
    });

    // Build department stats ensuring all departments are included
    const departmentStats = departments.map(dept => {
      const stat = statsMap[dept.name] || {
        department: dept.name,
        totalRequests: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        inReview: 0
      };

      const approved = stat.approved || 0;
      const rejected = stat.rejected || 0;
      const pending = stat.pending || 0;
      const total = stat.totalRequests || 0;

      // Calculate progress percentage (approved + rejected out of total)
      const processedCount = approved + rejected;
      const progressPercentage = total > 0 ? Math.round((processedCount / total) * 100) : 0;

      return {
        departmentName: dept.name,
        role: dept.role,
        totalRequests: total,
        approved: approved,
        rejected: rejected,
        pending: pending,
        inReview: stat.inReview || 0,
        progressPercentage: progressPercentage,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
        pendingRate: total > 0 ? Math.round((pending / total) * 100) : 0
      };
    });

    // Calculate overall statistics
    const overallStats = departmentStats.reduce(
      (acc, dept) => ({
        totalRequests: acc.totalRequests + dept.totalRequests,
        totalApproved: acc.totalApproved + dept.approved,
        totalRejected: acc.totalRejected + dept.rejected,
        totalPending: acc.totalPending + dept.pending,
        totalInReview: acc.totalInReview + dept.inReview
      }),
      {
        totalRequests: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalPending: 0,
        totalInReview: 0
      }
    );

    // Add overall progress metrics
    const overallProcessed = overallStats.totalApproved + overallStats.totalRejected;
    overallStats.progressPercentage = overallStats.totalRequests > 0 
      ? Math.round((overallProcessed / overallStats.totalRequests) * 100) 
      : 0;
    overallStats.approvalRate = overallStats.totalRequests > 0 
      ? Math.round((overallStats.totalApproved / overallStats.totalRequests) * 100) 
      : 0;
    overallStats.rejectionRate = overallStats.totalRequests > 0 
      ? Math.round((overallStats.totalRejected / overallStats.totalRequests) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        overall: overallStats,
        departments: departmentStats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/department-stats/:departmentName
 * Update department statistics (called by department heads)
 */
router.put('/department-stats/:departmentName', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { departmentName } = req.params;
    const { totalRequests, approvedRequests, rejectedRequests, pendingRequests, notes } = req.body;

    const stats = await DepartmentStats.findOneAndUpdate(
      { departmentName },
      {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        notes,
        lastUpdated: new Date(),
        updatedBy: {
          id: req.user.id,
          name: req.user.full_name,
          email: req.user.email
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Statistics updated for ${departmentName}`,
      data: stats.getSummary()
    });
  } catch (error) {
    console.error('Error updating department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department statistics'
    });
  }
});

/**
 * GET /api/admin/department-stats/:departmentName
 * Get specific department statistics
 */
router.get('/department-stats/:departmentName', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { departmentName } = req.params;

    const stats = await DepartmentStats.findOne({ departmentName });

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Department statistics not found'
      });
    }

    res.json({
      success: true,
      data: stats.getSummary()
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics'
    });
  }
});

/**
 * GET /api/admin/department-messages/:role
 * Get all admin messages received by a specific department/role
 */
router.get('/department-messages/:role', verifyToken, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify the user belongs to the requesting department (case-insensitive)
    const userRoleMatches = req.user.role && new RegExp(`^${role}$`, 'i').test(req.user.role);
    if (!userRoleMatches && req.user.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only view your own department messages.'
      });
    }

    const messages = await Message.find({
      recipient_department: new RegExp(`^${role}$`, 'i'),  // Case-insensitive match
      message_type: { $in: ['notification', 'reminder'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Message.countDocuments({
      recipient_department: new RegExp(`^${role}$`, 'i'),  // Case-insensitive match
      message_type: { $in: ['notification', 'reminder'] }
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (error) {
    console.error('Error fetching department messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department messages',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/student-messages/:studentSapId
 * Get all admin messages received by a specific student
 */
router.get('/student-messages/:studentSapId', verifyToken, async (req, res) => {
  try {
    const { studentSapId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify the user is accessing their own messages or is admin
    if (req.user.sap !== studentSapId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only view your own messages.'
      });
    }

    const messages = await Message.find({
      recipient_sapid: studentSapId,
      message_type: { $in: ['notification', 'admin-notification'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Message.countDocuments({
      recipient_sapid: studentSapId,
      message_type: { $in: ['notification', 'admin-notification'] }
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (error) {
    console.error('Error fetching student messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student messages',
      error: error.message
    });
  }
});

// =====================
// USER MANAGEMENT ROUTES
// =====================

const bcrypt = require('bcryptjs');

// MIGRATE: Add timestamps to existing users (admin only)
router.post('/migrate-timestamps', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const now = new Date();
    
    // Find all users without createdAt
    const usersWithoutTimestamps = await User.find({ createdAt: { $exists: false } });
    
    console.log(`🔍 Found ${usersWithoutTimestamps.length} users without timestamps`);
    
    let migratedCount = 0;
    
    // Update each user individually to ensure timestamps are set
    for (let user of usersWithoutTimestamps) {
      user.createdAt = now;
      user.updatedAt = now;
      await user.save();
      migratedCount++;
    }

    console.log(`✅ Successfully migrated ${migratedCount} users with timestamps`);
    res.status(200).json({ 
      success: true, 
      message: `✅ Added timestamps to ${migratedCount} users`,
      migratedCount: migratedCount
    });
  } catch (error) {
    console.error('Migration Error:', error);
    res.status(500).json({ success: false, message: '❌ Migration failed: ' + error.message });
  }
});

// GET ALL USERS (admin only)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`📊 Admin - Retrieved ${users.length} users`);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch users' });
  }
});

// CREATE NEW USER (admin only)
/**
 * POST /api/admin/check-email
 * Check if email already exists in database
 */
router.post('/check-email', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    res.json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Check Email Error:', error);
    res.status(500).json({ success: false, message: 'Failed to check email' });
  }
});

router.post('/create-user', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { full_name, email, password, role, department, sap } = req.body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: '❌ Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '❌ Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '❌ Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role.toLowerCase(),
      department: department || null,
      sap: sap || null
    });

    await newUser.save();

    console.log(`✅ Admin - Created new user: ${newUser.email} (${newUser.role})`);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: `✅ User ${full_name} created successfully`,
      data: userResponse
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to create user' });
  }
});

// DELETE USER (admin only, cannot delete students)
router.delete('/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '❌ User not found' });
    }

    // Prevent deletion of students
    if (user.role === 'student') {
      return res.status(400).json({ success: false, message: '❌ Cannot delete student users' });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    console.log(`🗑️ Admin - Deleted user: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: `✅ User ${user.full_name} deleted successfully`
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to delete user' });
  }
});

// =====================
// GET ALL MESSAGES FOR ADMIN
// =====================
router.get("/message-log", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    console.log(`📨 Fetching message log for admin:`, adminId);

    // Get messages that are:
    // 1. Sent BY admin TO departments (sender_id === admin's id AND recipient_department is set)
    // 2. Received BY admin FROM departments (recipient_department === "Admin")
    const messages = await Message.find({
      $or: [
        { 
          sender_id: adminId,
          recipient_department: { $exists: true, $ne: null }  // Admin sent to a department
        },
        { recipient_department: "Admin" }  // Messages received from departments to admin
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Format messages for admin view
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      subject: msg.subject,
      message: msg.message,
      sender_name: msg.sender_name,
      sender_role: msg.sender_role,
      sender_id: msg.sender_id,
      recipient_department: msg.recipient_department,
      recipient_id: msg.recipient_id,
      sender_type: msg.sender_id?.toString() === adminId.toString() ? "admin" : "student",
      created_at: msg.createdAt,
      status: msg.status,
      is_read: msg.is_read
    }));

    console.log(`✅ Found ${formattedMessages.length} messages for admin (sent to departments + received from departments)`);

    res.json({
      success: true,
      data: formattedMessages || [],
      count: formattedMessages.length
    });
  } catch (err) {
    console.error("Admin Message Log Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message log"
    });
  }
});

module.exports = router;
