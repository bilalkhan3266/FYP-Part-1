const mongoose = require("mongoose");

const departmentIssueSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  departmentName: {
    type: String,
    required: true,
    enum: ["Coordination", "Library", "Transport", "Fee Department", "Student Service"],
    index: true,
  },
  itemType: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Issued", "Pending", "Uncleared", "Cleared"],
    default: "Issued",
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  issuedByName: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

// Compound index for fast clearance lookups
departmentIssueSchema.index({ studentId: 1, departmentName: 1, status: 1 });

const DepartmentIssue = mongoose.models.DepartmentIssue || mongoose.model("DepartmentIssue", departmentIssueSchema);

module.exports = DepartmentIssue;
