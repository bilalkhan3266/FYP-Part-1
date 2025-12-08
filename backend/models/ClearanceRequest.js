const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema({
  sapid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  student_name: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  submitted_at: { type: Date, default: Date.now },
  department: String,
  status: { type: String, default: "Pending" }
});

// Prevent model overwrite
const ClearanceRequest = mongoose.models.ClearanceRequest || mongoose.model("ClearanceRequest", clearanceSchema);

module.exports = ClearanceRequest;
