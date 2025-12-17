// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AdminMessage = require('../models/AdminMessage');
const DepartmentStats = require('../models/DepartmentStats');
const User = require('../models/User');
const Message = require('../models/Message');

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
        await Message.insertMany(departmentMessages);

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
        await Message.insertMany(roleMessages);
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
 */
router.get('/department-stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const departments = [
      { name: 'Library', role: 'library' },
      { name: 'Transport', role: 'transport' },
      { name: 'Laboratory', role: 'laboratory' },
      { name: 'Fee Department', role: 'feedepartment' },
      { name: 'Coordination', role: 'coordination' },
      { name: 'Student Services', role: 'studentservice' }
    ];

    let stats = await DepartmentStats.find({
      departmentName: { $in: departments.map(d => d.name) }
    });

    // If no stats exist, initialize them
    if (stats.length === 0) {
      const initialStats = departments.map(dept => ({
        departmentName: dept.name,
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0
      }));

      stats = await DepartmentStats.insertMany(initialStats);
    }

    // Get real-time message counts per department (case-insensitive)
    const messageCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await Message.countDocuments({
          recipient_department: new RegExp(`^${dept.role}$`, 'i'),  // Case-insensitive match
          message_type: { $in: ['notification', 'reminder'] }
        });
        return {
          departmentName: dept.name,
          messageCount: count
        };
      })
    );

    // Create a map for quick lookup
    const messageCountMap = {};
    messageCounts.forEach(mc => {
      messageCountMap[mc.departmentName] = mc.messageCount;
    });

    // Calculate overall stats
    const overallStats = {
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalApproved: stats.reduce((sum, s) => sum + s.approvedRequests, 0),
      totalRejected: stats.reduce((sum, s) => sum + s.rejectedRequests, 0),
      totalPending: stats.reduce((sum, s) => sum + s.pendingRequests, 0),
      totalMessages: messageCounts.reduce((sum, mc) => sum + mc.messageCount, 0)
    };

    // Format department stats with progress percentages and message counts
    const departmentStats = stats.map(stat => ({
      id: stat._id,
      departmentName: stat.departmentName,
      totalRequests: stat.totalRequests,
      approved: stat.approvedRequests,
      rejected: stat.rejectedRequests,
      pending: stat.pendingRequests,
      receivedMessages: messageCountMap[stat.departmentName] || 0,
      progressPercentage: stat.getProgressPercentage && stat.getProgressPercentage() || 0,
      lastUpdated: stat.lastUpdated
    }));

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

module.exports = router;
