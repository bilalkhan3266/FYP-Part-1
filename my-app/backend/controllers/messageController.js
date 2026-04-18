import Message from "../models/Message.js";

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { studentId, subject, message, sender } = req.body;

    const newMsg = await Message.create({
      studentId,
      subject,
      message,
      sender,
    });

    res.status(201).json({
      success: true,
      message: "Message sent!",
      data: newMsg,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Message History
export const getHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const history = await Message.find({ studentId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      messages: history,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
