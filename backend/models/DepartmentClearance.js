const mongoose = require("mongoose");

const departmentClearanceSchema = new mongoose.Schema({
  clearance_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClearanceRequest' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sapid: String,
  student_name: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department_name: String,
  status: { type: String, default: 'Pending' },
  remarks: String,
  approved_by: String,
  approved_at: Date,
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite
const DepartmentClearance = mongoose.models.DepartmentClearance || mongoose.model('DepartmentClearance', departmentClearanceSchema);

module.exports = DepartmentClearance;
