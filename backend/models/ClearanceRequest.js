const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sapid: String,
  student_name: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department: String,
  status: { type: String, default: "Pending" },
  submitted_at: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite
const ClearanceRequest = mongoose.models.ClearanceRequest || mongoose.model("ClearanceRequest", clearanceSchema);

module.exports = ClearanceRequest;
