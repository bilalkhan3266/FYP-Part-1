const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: String, default: "Student" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
