const mongoose = require("mongoose");

// Message Schema (Two-way conversation between students and departments)
const messageSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true, index: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: String,
  sender_role: String,
  sender_sapid: String,
  recipient_sapid: { type: String, required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient_department: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  message_type: { type: String, enum: ['info', 'warning', 'error', 'success', 'question', 'reply', 'library_request', 'library_approval', 'library_rejection'], default: 'reply' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  is_read: { type: Boolean, default: false },
  read_at: Date,
  remarks: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parent_message_id: mongoose.Schema.Types.ObjectId,
  studentId: String,
  studentName: String,
  department: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Export using the pattern: return existing model if already compiled, otherwise create new one
module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
