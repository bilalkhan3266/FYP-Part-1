const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');
const Message = require('../models/Message');
const User = require('../models/User');

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
        message: '❌ All fields are required'
      });
    }

    const newMessage = new Message({
      sender_id: senderId,
      sender_name: req.user.full_name || 'Library Staff',
      sender_role: 'Library',
      recipient_sapid: recipient_sapid.trim(),
      subject: subject.trim(),
      message: message.trim(),
      message_type: message_type || 'info',
      is_read: false,
      createdAt: new Date()
    });

    await newMessage.save();

    console.log(`✅ Message sent successfully to ${recipient_sapid}`);
    
    res.status(201).json({
      success: true,
      message: '✅ Message sent successfully!',
      data: { id: newMessage._id }
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

module.exports = router;
