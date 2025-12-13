const mongoose = require("mongoose");

// Message Schema (Two-way conversation between students and departments)
const messageSchema = new mongoose.Schema({
  conversation_id: { type: String, index: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sender_name: String,
  sender_role: String,
  sender_sapid: { type: String, index: true },
  recipient_sapid: { type: String, required: true, index: true }, // ✅ INDEXED FOR FAST LOOKUP
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  recipient_department: { type: String, index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  message_type: { type: String, enum: ['info', 'warning', 'error', 'success', 'question', 'reply', 'library_request', 'library_approval', 'library_rejection', 'notification', 'fee_approval', 'fee_rejection'], default: 'reply' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  is_read: { type: Boolean, default: false, index: true },
  read_at: Date,
  remarks: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parent_message_id: mongoose.Schema.Types.ObjectId,
  studentId: String,
  studentName: String,
  sapid: String,
  department: String,
  program: String,
  semester: String,
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ COMPOSITE INDEXES FOR FAST QUERIES
messageSchema.index({ recipient_sapid: 1, is_read: 1 });
messageSchema.index({ sender_sapid: 1, recipient_sapid: 1 });
messageSchema.index({ recipient_department: 1, status: 1 });
messageSchema.index({ conversation_id: 1, createdAt: -1 });

// Export using the pattern: return existing model if already compiled, otherwise create new one
module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
