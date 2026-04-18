const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sapid: String,
  student_name: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department: String,
  status: { type: String, default: "Pending" },
  // HOD approval status: null/Pending -> Ready for HOD -> HOD Approved -> Completed
  hod_status: { type: String, enum: [null, 'Ready for HOD', 'HOD Approved', 'Completed'], default: null },
  hod_approved_by: String,  // HOD name/email who approved
  hod_approved_at: Date,
  qr_code: String,          // QR code unique identifier
  // Certificate tracking
  certificate_status: { type: String, enum: ['Not Ready', 'Ready', 'Sent', 'Downloaded'], default: 'Not Ready' },
  certificate_sent_at: Date,
  certificate_downloaded_at: Date,
  certificate_qr_code: String,  // QR code for certificate verification
  submitted_at: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite
const ClearanceRequest = mongoose.models.ClearanceRequest || mongoose.model("ClearanceRequest", clearanceSchema);

module.exports = ClearanceRequest;
