const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const verifyToken = require("../verifyToken");

// ====== GET ALL MESSAGES FOR A STUDENT ======
router.get("/my-messages", verifyToken, async (req, res) => {
  try {
    const sapid = req.user.sapid || req.user.sap_id;

    if (!sapid) {
      return res.status(400).json({
        success: false,
        message: "Student SAP ID not found"
      });
    }

    // Fetch all messages for this student (both sent and received)
    const messages = await Message.find({
      $or: [
        { sender_sapid: sapid },
        { recipient_sapid: sapid }
      ]
    }).sort({ createdAt: -1 });

    // Group by conversation_id or create unique conversations
    const messageMap = {};
    messages.forEach(msg => {
      const convId = msg.conversation_id || msg._id.toString();
      if (!messageMap[convId]) {
        messageMap[convId] = {
          conversation_id: convId,
          subject: msg.subject,
          recipient_department: msg.recipient_department,
          last_message: msg.message,
          createdAt: msg.createdAt,
          messages: []
        };
      }
      messageMap[convId].messages.push({
        _id: msg._id,
        message: msg.message,
        subject: msg.subject,
        sender_role: msg.sender_role,
        sender_name: msg.sender_name,
        createdAt: msg.createdAt,
        is_read: msg.is_read
      });
    });

    res.json({
      success: true,
      data: Object.values(messageMap)
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

    const sapid = req.user.sapid || req.user.sap_id;
    const conversationId = `${sapid}-${recipientRole}-${Date.now()}`;

    const newMessage = new Message({
      conversation_id: conversationId,
      sender_id: req.user._id || req.user.id,
      sender_name: req.user.full_name || req.user.name,
      sender_role: req.user.role || "Student",
      sender_sapid: sapid,
      recipient_department: recipientRole,
      recipient_sapid: sapid, // Self for now, department staff will have their own
      subject,
      message,
      message_type: "question",
      status: "Pending",
      studentId: sapid
    });

    await newMessage.save();

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
      sender_sapid: req.user.sapid || req.user.sap_id,
      recipient_department: originalMessage.recipient_department,
      recipient_sapid: originalMessage.sender_sapid,
      subject: `Re: ${originalMessage.subject}`,
      message,
      message_type: "reply",
      parent_message_id: messageId,
      studentId: req.user.sapid || req.user.sap_id
    });

    await replyMessage.save();

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
    const sapid = req.user.sapid || req.user.sap_id;

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

module.exports = router;
