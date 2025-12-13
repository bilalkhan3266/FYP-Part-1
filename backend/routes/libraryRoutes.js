const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');
const Message = require('../models/Message');
const User = require('../models/User');
const messageHelper = require('../utils/messageHelper'); // ✅ ADD HELPER

// ============================================
// GET PENDING MESSAGES FROM MONGODB
// ============================================
router.get('/library/pending-messages', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching pending library messages...');
    
    const messages = await Message.find({ 
      message_type: 'library_request', 
      status: 'Pending' 
    }).sort({ createdAt: -1 }).exec();

    console.log(`✅ Found ${messages.length} pending messages`);
    
    res.status(200).json({ 
      success: true, 
      data: messages,
      count: messages.length
    });
  } catch (err) {
    console.error('❌ Error fetching pending messages:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to fetch pending messages',
      error: err.message
    });
  }
});

// ============================================
// CREATE LIBRARY MESSAGE (Student submits request)
// ============================================
router.post('/library/create-request', verifyToken, async (req, res) => {
  try {
    const { subject, message, program, semester } = req.body;
    const studentId = req.user.id;
    const studentName = req.user.full_name;
    const sapid = req.user.sap;
    const department = req.user.department;

    console.log(`📝 Creating library request from student: ${sapid}`);

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: '❌ Subject and message are required'
      });
    }

    const libraryMessage = new Message({
      sender_id: studentId,
      sender_name: studentName,
      sender_role: 'Student',
      sender_sapid: sapid,
      recipient_sapid: sapid,
      subject: subject.trim(),
      message: message.trim(),
      message_type: 'library_request',
      status: 'Pending',
      is_read: false,
      studentId: studentId.toString(),
      studentName: studentName,
      sapid: sapid,
      department: department,
      program: program || 'N/A',
      semester: semester || 'N/A',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await libraryMessage.save();

    console.log(`✅ Library request created: ${libraryMessage._id}`);

    res.status(201).json({
      success: true,
      message: '✅ Library request submitted successfully!',
      data: libraryMessage
    });
  } catch (err) {
    console.error('❌ Error creating library request:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to create library request',
      error: err.message
    });
  }
});

// ============================================
// GET APPROVED MESSAGES
// ============================================
router.get('/library/approved-messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      message_type: 'library_request', 
      status: 'Approved' 
    }).sort({ updatedAt: -1 }).exec();

    res.status(200).json({ 
      success: true, 
      data: messages,
      count: messages.length
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to fetch approved messages'
    });
  }
});

// ============================================
// GET REJECTED MESSAGES
// ============================================
router.get('/library/rejected-messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      message_type: 'library_request', 
      status: 'Rejected' 
    }).sort({ updatedAt: -1 }).exec();

    res.status(200).json({ 
      success: true, 
      data: messages,
      count: messages.length
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to fetch rejected messages'
    });
  }
});

// ============================================
// APPROVE MESSAGE - UPDATE & SEND MESSAGE TO STUDENT
// ============================================
router.put('/library/messages/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const librarianId = req.user.id;

    console.log(`✅ Approving message ID: ${id}`);

    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        remarks: remarks || '',
        approvedBy: librarianId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ 
        success: false, 
        message: '❌ Message not found' 
      });
    }

    // Send approval notification to student
    const approvalMessage = new Message({
      sender_id: librarianId,
      sender_name: req.user.full_name || 'Library',
      sender_role: 'Library',
      recipient_sapid: updatedMessage.sapid || updatedMessage.recipient_sapid,
      subject: '✅ Library Clearance Approved',
      message: `Your library clearance request has been approved! ${remarks ? 'Remarks: ' + remarks : ''}`,
      message_type: 'library_approval',
      is_read: false,
      createdAt: new Date()
    });

    await approvalMessage.save();

    console.log(`✅ Approval notification sent to ${updatedMessage.sapid}`);

    res.status(200).json({ 
      success: true, 
      message: '✅ Request approved and student notified!'
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Server error'
    });
  }
});

// ============================================
// REJECT MESSAGE - UPDATE & SEND MESSAGE TO STUDENT
// ============================================
router.put('/library/messages/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const librarianId = req.user.id;

    console.log(`❌ Rejecting message ID: ${id}`);

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Rejection remarks are required'
      });
    }

    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        remarks: remarks.trim(),
        approvedBy: librarianId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ 
        success: false, 
        message: '❌ Message not found' 
      });
    }

    // Send rejection notification to student
    const rejectionMessage = new Message({
      sender_id: librarianId,
      sender_name: req.user.full_name || 'Library',
      sender_role: 'Library',
      recipient_sapid: updatedMessage.sapid || updatedMessage.recipient_sapid,
      subject: '❌ Library Clearance Rejected',
      message: `Your library clearance request has been rejected. Reason: ${remarks.trim()}`,
      message_type: 'library_rejection',
      is_read: false,
      createdAt: new Date()
    });

    await rejectionMessage.save();

    console.log(`❌ Rejection notification sent to ${updatedMessage.sapid}`);

    res.status(200).json({ 
      success: true, 
      message: '✅ Request rejected and student notified!'
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Server error'
    });
  }
});

// ============================================
// SEND MESSAGE TO STUDENT (From Library Staff)
// ============================================
router.post('/send-message', verifyToken, async (req, res) => {
  try {
    const { recipient_sapid, subject, message, message_type } = req.body;
    const senderId = req.user.id;

    console.log(`📤 Sending message to SAPID: ${recipient_sapid}`);

    // Validate input
    if (!recipient_sapid || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: '❌ Recipient SAP ID, subject, and message are required'
      });
    }

    // ✅ USE HELPER TO FIND STUDENT
    const student = await messageHelper.findStudentBySapId(recipient_sapid);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `❌ Student with SAP ID ${recipient_sapid} not found`
      });
    }

    const newMessage = new Message({
      sender_id: senderId,
      sender_name: req.user.full_name || 'Library Staff',
      sender_role: 'Library',
      sender_sapid: req.user.sap || req.user.sap_id,
      recipient_id: student._id, // ✅ STORE STUDENT ID
      recipient_sapid: recipient_sapid.trim(),
      recipient_department: 'Library',
      subject: subject.trim(),
      message: message.trim(),
      message_type: message_type || 'info',
      is_read: false,
      createdAt: new Date()
    });

    await newMessage.save();

    console.log(`✅ Message sent successfully to ${student.full_name}`);
    
    res.status(201).json({
      success: true,
      message: '✅ Message sent successfully!',
      data: { 
        id: newMessage._id,
        recipient: student.full_name
      }
    });
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to send message',
      error: err.message
    });
  }
});

// ============================================
// GET MY MESSAGES (For Library Staff)
// ============================================
router.get('/my-messages', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.id;

    const messages = await Message.find({
      sender_id: senderId,
      sender_role: 'Library'
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    res.status(200).json({
      success: true,
      data: messages || []
    });
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch messages'
    });
  }
});

// ============================================
// UPDATE PROFILE (For Library Staff)
// ============================================
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, sap, department, password } = req.body;

    console.log(`🔄 Updating profile for user: ${userId}`);

    // Validate input
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: '❌ Full name and email are required'
      });
    }

    const updateData = {
      full_name,
      email,
      sap: sap || null,
      department: department || null
    };

    // If password is provided, hash and update it
    if (password && password.trim()) {
      const bcrypt = require('bcryptjs');
      updateData.password = bcrypt.hashSync(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '❌ User not found'
      });
    }

    console.log(`✅ Profile updated successfully`);
    
    res.status(200).json({
      success: true,
      message: '✅ Profile updated successfully!',
      data: {
        id: updatedUser._id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        sap: updatedUser.sap,
        department: updatedUser.department
      }
    });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to update profile',
      error: err.message
    });
  }
});

// ============================================
// GET LIBRARY REQUESTS BY STATUS
// ============================================
router.get('/library/requests/:status', verifyToken, async (req, res) => {
  try {
    // Check if user is library staff
    const userRole = (req.user.role || '').toLowerCase();
    console.log(`📋 User attempting to access library requests. Role: ${userRole}, Full role: ${req.user.role}`);
    
    if (userRole !== 'library') {
      return res.status(403).json({
        success: false,
        message: `❌ Access denied. Your role is "${req.user.role}". Only library staff can access this resource.`
      });
    }

    const { status } = req.params;
    
    // Map URL status to database status
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    
    const dbStatus = statusMap[status.toLowerCase()];
    
    if (!dbStatus) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid status. Use: pending, approved, or rejected'
      });
    }

    console.log(`📋 Fetching ${status} requests...`);
    
    const requests = await Message.find({ 
      message_type: 'library_request', 
      status: dbStatus 
    }).sort({ createdAt: -1 }).exec();

    console.log(`✅ Found ${requests.length} ${status} requests`);
    
    // Convert MongoDB documents to match frontend expectations
    const formattedRequests = requests.map(req => ({
      id: req._id.toString(),
      student_name: req.sender_name || req.studentName || 'Unknown',
      sapid: req.sender_sapid || req.sapid || 'N/A',
      program: req.program || 'N/A',
      semester: req.semester || 'N/A',
      status: req.status || 'Pending',
      subject: req.subject,
      message: req.message,
      createdAt: req.createdAt
    }));
    
    res.status(200).json({ 
      success: true, 
      requests: formattedRequests || [],
      count: formattedRequests.length
    });
  } catch (err) {
    console.error('❌ Error fetching requests:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to fetch requests',
      error: err.message
    });
  }
});

// ============================================
// APPROVE LIBRARY REQUEST
// ============================================
router.post('/library/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    // Check if user is library staff
    const userRole = req.user.role.toLowerCase();
    if (userRole !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied. Only library staff can approve requests.'
      });
    }

    const { id } = req.params;

    console.log(`✅ Approving request: ${id}`);
    
    const request = await Message.findByIdAndUpdate(
      id,
      { status: 'Approved', updatedAt: new Date() },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: '✅ Request approved successfully',
      data: request
    });
  } catch (err) {
    console.error('❌ Error approving request:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to approve request',
      error: err.message
    });
  }
});

// ============================================
// REJECT LIBRARY REQUEST
// ============================================
router.post('/library/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    // Check if user is library staff
    const userRole = req.user.role.toLowerCase();
    if (userRole !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied. Only library staff can reject requests.'
      });
    }

    const { id } = req.params;

    console.log(`❌ Rejecting request: ${id}`);
    
    const request = await Message.findByIdAndUpdate(
      id,
      { status: 'Rejected', updatedAt: new Date() },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: '✅ Request rejected successfully',
      data: request
    });
  } catch (err) {
    console.error('❌ Error rejecting request:', err);
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to reject request',
      error: err.message
    });
  }
});

module.exports = router;
