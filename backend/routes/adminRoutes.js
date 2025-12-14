// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminMessage = require('../models/AdminMessage');
const DepartmentStats = require('../models/DepartmentStats');
const User = require('../models/User');
const Message = require('../models/Message');

// Middleware: Verify Admin Role
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== 'hod') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// =====================
// ADMIN MESSAGE ROUTES
// =====================

/**
 * POST /api/admin/send-message
 * Send message to departments or students
 */
router.post('/send-message', verifyAdmin, async (req, res) => {
  try {
    const { messageType, targetType, department, studentSapId, subject, message, priority } = req.body;

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

    // Create admin message record
    const adminMessage = new AdminMessage({
      sender: {
        id: req.user.id,
        name: req.user.full_name,
        email: req.user.email,
        role: req.user.role
      },
      messageType,
      targetType: messageType === 'department' ? targetType : undefined,
      recipientDepartment: messageType === 'department' ? department : undefined,
      recipientSapId: messageType === 'student' ? studentSapId : undefined,
      subject,
      message,
      priority: priority || 'normal',
      status: 'sent'
    });

    await adminMessage.save();

    // Handle department messages
    if (messageType === 'department') {
      let departmentUsers = [];

      if (targetType === 'all') {
        // Get all non-student users
        departmentUsers = await User.find({
          role: { $in: ['library', 'transport', 'laboratory', 'feedepartment', 'coordination', 'studentservice'] }
        });
      } else if (targetType === 'specific') {
        // Get users from specific department
        const roleMap = {
          'Library': 'library',
          'Transport': 'transport',
          'Laboratory': 'laboratory',
          'Fee Department': 'feedepartment',
          'Coordination': 'coordination',
          'Student Services': 'studentservice'
        };

        const role = roleMap[department];
        if (!role) {
          return res.status(400).json({
            success: false,
            message: 'Invalid department'
          });
        }

        departmentUsers = await User.find({ role });
      }

      // Create messages for each department user
      const departmentMessages = departmentUsers.map(user => ({
        sender: req.user.id,
        senderName: req.user.full_name,
        recipient: user._id,
        recipientName: user.full_name,
        recipientEmail: user.email,
        recipientRole: user.role,
        subject: `[ADMIN REMINDER] ${subject}`,
        message,
        messageType: 'reminder',
        priority: priority || 'normal',
        isRead: false,
        createdAt: new Date()
      }));

      if (departmentMessages.length > 0) {
        await Message.insertMany(departmentMessages);
      }
    }

    // Handle student messages
    if (messageType === 'student') {
      const student = await User.findOne({ sap: studentSapId });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const studentMessage = new Message({
        sender: req.user.id,
        senderName: req.user.full_name,
        recipient: student._id,
        recipientName: student.full_name,
        recipientEmail: student.email,
        recipientRole: student.role,
        subject,
        message,
        messageType: 'admin-notification',
        priority: priority || 'normal',
        isRead: false,
        createdAt: new Date()
      });

      await studentMessage.save();
    }

    res.json({
      success: true,
      message: `Message sent successfully to ${messageType === 'department' ? 'department' : 'student'}`,
      data: {
        messageId: adminMessage._id,
        messageType,
        recipientCount: messageType === 'department' ? departmentUsers?.length || 0 : 1,
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
router.get('/messages', verifyAdmin, async (req, res) => {
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
router.get('/department-stats', verifyAdmin, async (req, res) => {
  try {
    const departments = [
      'Library',
      'Transport',
      'Laboratory',
      'Fee Department',
      'Coordination',
      'Student Services'
    ];

    let stats = await DepartmentStats.find({
      departmentName: { $in: departments }
    });

    // If no stats exist, initialize them
    if (stats.length === 0) {
      const initialStats = departments.map(dept => ({
        departmentName: dept,
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0
      }));

      stats = await DepartmentStats.insertMany(initialStats);
    }

    // Calculate overall stats
    const overallStats = {
      totalRequests: stats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalApproved: stats.reduce((sum, s) => sum + s.approvedRequests, 0),
      totalRejected: stats.reduce((sum, s) => sum + s.rejectedRequests, 0),
      totalPending: stats.reduce((sum, s) => sum + s.pendingRequests, 0)
    };

    // Format department stats with progress percentages
    const departmentStats = stats.map(stat => ({
      id: stat._id,
      departmentName: stat.departmentName,
      totalRequests: stat.totalRequests,
      approved: stat.approvedRequests,
      rejected: stat.rejectedRequests,
      pending: stat.pendingRequests,
      progressPercentage: stat.getProgressPercentage(),
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
      message: 'Failed to fetch department statistics'
    });
  }
});

/**
 * PUT /api/admin/department-stats/:departmentName
 * Update department statistics (called by department heads)
 */
router.put('/department-stats/:departmentName', verifyAdmin, async (req, res) => {
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
router.get('/department-stats/:departmentName', verifyAdmin, async (req, res) => {
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

module.exports = router;
