const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // ✅ correct path
const { verifyToken } = require("../server"); // or move verifyToken to middleware/auth.js

 // adjust path

// Send a new message
router.post("/send", verifyToken, async (req, res) => {
try {
const { subject, message } = req.body;
if (!subject || !message)
return res.status(400).json({ success: false, message: "All fields required" });

const newMessage = new Message({
  studentId: req.user.id,
  subject,
  message,
  sender: req.user.role === "Student" ? "Student" : "Department",
});
await newMessage.save();
res.json({ success: true, message: "Message sent", data: newMessage });


} catch (err) {
console.error("Send Message Error:", err);
res.status(500).json({ success: false, message: "Server error" });
}
});

// Get message history for the current user
router.get("/history", verifyToken, async (req, res) => {
try {
const messages = await Message.find({ studentId: req.user.id }).sort({ createdAt: -1 });
res.json({ success: true, messages });
} catch (err) {
console.error("Message History Error:", err);
res.status(500).json({ success: false, message: "Server error" });
}
});

module.exports = router;
