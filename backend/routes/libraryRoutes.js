const express = require("express");
const router = express.Router();
const verifyToken = require("../verifyToken");
const Message = require("../models/Message");

// Create LibraryMessage model dynamically or use a simple approach
// We'll work with messages collection but filter for library requests

// GET pending messages for library dashboard
router.get("/library/pending-messages", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      message_type: "library_request", 
      status: "Pending" 
    }).sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: messages.map(msg => ({
        id: msg._id,
        student_id: msg.studentId,
        sapid: msg.sapid,
        student_name: msg.studentName,
        department: msg.department,
        subject: msg.subject,
        message: msg.message,
        status: msg.status,
        created_at: msg.createdAt
      }))
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET approved messages for library dashboard
router.get("/library/approved-messages", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      message_type: "library_request", 
      status: "Approved" 
    }).sort({ updatedAt: -1 });

    res.json({ 
      success: true, 
      data: messages.map(msg => ({
        id: msg._id,
        student_id: msg.studentId,
        sapid: msg.sapid,
        student_name: msg.studentName,
        department: msg.department,
        subject: msg.subject,
        message: msg.message,
        status: msg.status,
        remarks: msg.remarks,
        approved_at: msg.updatedAt
      }))
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET rejected messages for library dashboard
router.get("/library/rejected-messages", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ 
      message_type: "library_request", 
      status: "Rejected" 
    }).sort({ updatedAt: -1 });

    res.json({ 
      success: true, 
      data: messages.map(msg => ({
        id: msg._id,
        student_id: msg.studentId,
        sapid: msg.sapid,
        student_name: msg.studentName,
        department: msg.department,
        subject: msg.subject,
        message: msg.message,
        status: msg.status,
        remarks: msg.remarks,
        approved_at: msg.updatedAt
      }))
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// APPROVE a library message and send notification to student
router.put("/library/messages/:id/approve", verifyToken, async (req, res) => {
  try {
    const { remarks } = req.body;
    const librarianId = req.user.id;

    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      {
        status: "Approved",
        remarks: remarks || "",
        approvedBy: librarianId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Send approval notification to student
    const approvalMessage = new Message({
      sender: librarianId,
      recipient_sapid: updatedMessage.sapid,
      studentId: updatedMessage.studentId,
      subject: "✅ Library Clearance Approved",
      message: `Your library clearance request has been approved! ${remarks ? "Remarks: " + remarks : ""}`,
      message_type: "library_approval",
      is_read: false,
      createdAt: new Date()
    });

    await approvalMessage.save();

    res.json({ 
      success: true, 
      message: "Message approved and student notified" 
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// REJECT a library message and send notification to student
router.put("/library/messages/:id/reject", verifyToken, async (req, res) => {
  try {
    const { remarks } = req.body;
    const librarianId = req.user.id;

    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        remarks: remarks || "",
        approvedBy: librarianId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Send rejection notification to student
    const rejectionMessage = new Message({
      sender: librarianId,
      recipient_sapid: updatedMessage.sapid,
      studentId: updatedMessage.studentId,
      subject: "❌ Library Clearance Rejected",
      message: `Your library clearance request has been rejected. ${remarks ? "Reason: " + remarks : ""}`,
      message_type: "library_rejection",
      is_read: false,
      createdAt: new Date()
    });

    await rejectionMessage.save();

    res.json({ 
      success: true, 
      message: "Message rejected and student notified" 
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
