const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const verifyToken = require("../verifyToken");

// ====== GET ALL MESSAGES FOR A STUDENT ======
router.get("/my-messages", verifyToken, async (req, res) => {
  try {
    const sapid = req.user.sapid || req.user.sap_id || req.user.sap; // ✅ SUPPORT ALL FIELD NAMES

    if (!sapid) {
      return res.status(400).json({
        success: false,
        message: "Student SAP ID not found"
      });
    }

    console.log(`📨 Fetching messages for SAP ID: ${sapid}`);

    // ✅ QUERY BY RECIPIENT_SAPID FOR MESSAGES SENT TO THIS STUDENT
    const messages = await Message.find({
      recipientSapId: sapid  // ✅ FIXED: Use proper query field
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${messages.length} messages`);

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

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required"
      });
    }

    // Find the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found"
      });
    }

    // Create reply using same conversation_id
    const replyMessage = new Message({
      conversation_id: originalMessage.conversation_id,
      sender_id: req.user._id || req.user.id,
      sender_name: req.user.full_name || req.user.name,
      sender_role: req.user.role || "Student",
      sender_sapid: req.user.sapid || req.user.sap_id || req.user.sap,
      recipient_department: originalMessage.recipient_department,
      recipient_sapid: originalMessage.sender_sapid,
      subject: `Re: ${originalMessage.subject}`,
      message,
      message_type: "reply",
      parent_message_id: messageId,
      studentId: req.user.sapid || req.user.sap_id || req.user.sap
    });

    await replyMessage.save();

    console.log(`✅ Reply sent successfully`);

    res.json({
      success: true,
      message: "Reply sent successfully",
      data: replyMessage
    });
  } catch (err) {
    console.error("Reply Message Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send reply"
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
      recipientSapId: sapid,
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

module.exports = router;
