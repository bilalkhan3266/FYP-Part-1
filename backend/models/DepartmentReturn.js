const mongoose = require("mongoose");

const departmentReturnSchema = new mongoose.Schema({
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
  referenceIssueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DepartmentIssue",
    required: true,
  },
  returnDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Returned", "Cleared"],
    default: "Returned",
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedByName: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

departmentReturnSchema.index({ studentId: 1, departmentName: 1 });

const DepartmentReturn = mongoose.models.DepartmentReturn || mongoose.model("DepartmentReturn", departmentReturnSchema);

module.exports = DepartmentReturn;
