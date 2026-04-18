const mongoose = require("mongoose");

const departmentClearanceSchema = new mongoose.Schema({
  clearance_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClearanceRequest' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sapid: String,
  student_name: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department_name: String,
  status: { type: String, default: 'Pending' },
  remarks: String,
  approved_by: String,
  approved_at: Date,
  // Track if this request is ready for HOD (all depts approved)
  ready_for_hod: { type: Boolean, default: false },
  // Sequential workflow: 1=Coordination, 2=Transport, 3=Library, 4=Fee Department, 5=Student Service
  sequence_order: { type: Number, default: 1 },
  // Track if this was a resubmission after rejection
  resubmission_count: { type: Number, default: 0 },
  // Flag to indicate if this was auto-approved (requires no manual handling)
  isAutoApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite
const DepartmentClearance = mongoose.models.DepartmentClearance || mongoose.model('DepartmentClearance', departmentClearanceSchema);

module.exports = DepartmentClearance;
