const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const verifyToken = require("../verifyToken");

// ====== GET ALL MESSAGES FOR A STUDENT OR STAFF ======
router.get("/my-messages", verifyToken, async (req, res) => {
  try {
    const sapid = req.user.sapid || req.user.sap_id || req.user.sap; // ✅ SUPPORT ALL FIELD NAMES
    const userRole = req.user.role || "student"; // Get user role
    const userDepartment = req.user.department; // Get department for staff

    if (!sapid) {
      return res.status(400).json({
        success: false,
        message: "SAP ID not found"
      });
    }

    console.log(`📨 Fetching messages for SAP ID: ${sapid}, Role: ${userRole}, Department: ${userDepartment}`);

    let messages = [];

    // ✅ IF STUDENT: Query by recipient_sapid (messages sent to this student)
    if (userRole.toLowerCase() === "student") {
      messages = await Message.find({
        recipient_sapid: sapid
      })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`✅ Found ${messages.length} messages for student ${sapid}`);
    } 
    // ✅ IF STAFF: Query by recipient_id OR recipient_department
    else {
      // Get messages sent TO this staff member (recipient_id matches)
      // OR messages sent to their role as broadcast
      const userRole = req.user.role;
      const userId = req.user._id || req.user.id;
      
      console.log(`🔍 [my-messages] Querying for staff: ${userRole} (ID: ${userId})`);
      
      const roleRegex = new RegExp(`^${userRole}$`, 'i');
      
      messages = await Message.find({
        $or: [
          { recipient_id: userId },  // Individual messages sent to this staff member
          { recipient_department: roleRegex, message_type: 'notification' }  // Broadcast messages to department
        ]
      })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`✅ [my-messages] Found ${messages.length} messages for ${userRole} staff`);
    }

    res.json({
      success: true,
      data: messages || [],
      count: messages.length
    });
  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
});

// ====== SEND A NEW MESSAGE ======
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { recipientRole, subject, message } = req.body;

    if (!recipientRole || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Recipient, subject, and message are required"
      });
    }

    const sapid = req.user.sapid || req.user.sap_id || req.user.sap; // ✅ SUPPORT ALL FIELD NAMES
    const conversationId = `${sapid}-${recipientRole}-${Date.now()}`;

    const newMessage = new Message({
      conversation_id: conversationId,
      sender_id: req.user._id || req.user.id,
      sender_name: req.user.full_name || req.user.name,
      sender_role: req.user.role || "Student",
      sender_sapid: sapid,
      recipient_department: recipientRole,
      recipient_sapid: sapid,
      subject,
      message,
      message_type: "question",
      status: "Pending",
      studentId: sapid
    });

    await newMessage.save();

    console.log(`✅ Message sent successfully to ${recipientRole}`);

    res.json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});

// ====== REPLY TO A MESSAGE ======
router.post("/reply/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    console.log(`📨 Reply endpoint called with messageId: ${messageId}`);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required"
      });
    }

    // Find the original message - try with _id
    const originalMessage = await Message.findById(messageId);
    
    if (!originalMessage) {
      console.error(`❌ Message not found with ID: ${messageId}`);
      return res.status(404).json({
        success: false,
        message: "Original message not found"
      });
    }

    console.log(`✅ Found original message: ${originalMessage._id}`);
    console.log(`  Conversation ID: ${originalMessage.conversation_id}`);
    console.log(`  Sender SAPID: ${originalMessage.sender_sapid}`);
    console.log(`  Original Sender Role: ${originalMessage.sender_role}`);

    // ✅ CRITICAL FIX: Check if the ORIGINAL message was sent BY ADMIN
    // If yes, reply should go TO admin (set recipient_department = "Admin")
    // If no, reply should follow the same recipient_department as original
    let replyRecipientDept = originalMessage.recipient_department;
    let replyRecipientId = originalMessage.sender_id; // Send to whoever originally sent the message
    
    // Check if original sender is admin (has "admin" in their role)
    const originalSenderIsAdmin = originalMessage.sender_role && 
      originalMessage.sender_role.toLowerCase().includes('admin');
    
    if (originalSenderIsAdmin) {
      console.log(`✅ Original message was from ADMIN, setting recipient_department to 'Admin'`);
      replyRecipientDept = "Admin";  // ✅ THIS FIXES ISSUE 1
    }

    // Create reply using same conversation_id
    const replyMessage = new Message({
      conversation_id: originalMessage.conversation_id || `conv_${Date.now()}`,
      sender_id: req.user._id || req.user.id,
      sender_name: req.user.full_name || req.user.name || "Staff",
      sender_role: req.user.role || "staff",
      sender_sapid: req.user.sapid || req.user.sap_id || req.user.sap,
      recipient_id: replyRecipientId,
      recipient_department: replyRecipientDept,
      recipient_sapid: originalMessage.sender_sapid,
      subject: `Re: ${originalMessage.subject}`,
      message,
      message_type: "reply",
      parent_message_id: messageId,
      studentId: req.user.sapid || req.user.sap_id || req.user.sap
    });

    await replyMessage.save();

    console.log(`✅ Reply saved successfully: ${replyMessage._id}`);

    res.json({
      success: true,
      message: "Reply sent successfully",
      data: replyMessage
    });
  } catch (err) {
    console.error("Reply Message Error:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Failed to send reply: " + err.message
    });
  }
});

// ====== GET UNREAD MESSAGE COUNT ======
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const sapid = req.user.sapid || req.user.sap_id || req.user.sap; // ✅ SUPPORT ALL FIELD NAMES

    if (!sapid) {
      return res.status(400).json({
        success: false,
        message: "Student SAP ID not found"
      });
    }

    const unreadCount = await Message.countDocuments({
      recipient_sapid: sapid,
      is_read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (err) {
    console.error("Unread Count Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count"
    });
  }
});

// ====== MARK MESSAGE AS READ ======
router.put("/mark-read/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        is_read: true,
        read_at: new Date()
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    console.log(`✅ Message marked as read`);

    res.json({
      success: true,
      message: "Message marked as read",
      data: updatedMessage
    });
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read"
    });
  }
});

// ====== GET ALL MESSAGES FOR ADMIN ======
router.get("/admin/message-log", verifyToken, async (req, res) => {
  try {
    // Verify user is admin
    const userRole = req.user.role || req.user.user_type || "";
    
    if (!userRole.toLowerCase().includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view message logs"
      });
    }

    const adminId = req.user._id || req.user.id;
    console.log(`📨 Fetching message log for admin:`, adminId);

    // Get messages that are:
    // 1. Sent BY admin TO departments (sender_id === admin's id AND recipient_department is set)
    // 2. Received BY admin FROM departments (recipient_department === "Admin")
    const messages = await Message.find({
      $or: [
        { 
          sender_id: adminId,
          recipient_department: { $exists: true, $ne: null, $ne: "" }  // Admin sent to a department
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
