const mongoose = require("mongoose");

/**
 * ComprehensiveClearanceValidation Schema
 * Stores the result of validating a student against ALL departments in one pass
 * 
 * Uses sapId to check DepartmentIssue records for each department
 * Marks each department as Approved/Rejected with reasons
 * Only generates certificate if all departments are approved
 */
const comprehensiveClearanceValidationSchema = new mongoose.Schema({
  // Student info
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sapid: { type: String, required: true, index: true },
  student_name: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,

  // Department validation results (one entry per submission)
  departmentStatuses: [
    {
      name: {
        type: String,
        enum: ["Coordination", "Library", "Transport", "Fee Department", "Student Service"],
        required: true
      },
      status: {
        type: String,
        enum: ["Approved", "Rejected", "Not Processed"],
        required: true
      },
      reason: String, // e.g., "No dues", "Pending book not returned", "Outstanding fees"
      pendingItems: [String], // List of specific items that are pending
      validatedAt: Date
    }
  ],

  // Overall clearance status
  overallStatus: {
    type: String,
    enum: ["Pending", "Completed", "Rejected", "Resubmission"],
    default: "Pending"
  },

  // Certificate info (only if overallStatus === "Completed")
  certificateGenerated: { type: Boolean, default: false },
  qr_code: String,
  certificate_generated_at: Date,

  // Resubmission tracking
  submissionCount: { type: Number, default: 1 },
  previousSubmissions: [
    {
      submissionDate: Date,
      overallStatus: String,
      departmentStatuses: [{
        name: String,
        status: String,
        reason: String
      }]
    }
  ],

  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for fast lookups
comprehensiveClearanceValidationSchema.index({ sapid: 1, overallStatus: 1 });
comprehensiveClearanceValidationSchema.index({ student_id: 1 });
comprehensiveClearanceValidationSchema.index({ submittedAt: -1 });

const ComprehensiveClearanceValidation =
  mongoose.models.ComprehensiveClearanceValidation ||
  mongoose.model("ComprehensiveClearanceValidation", comprehensiveClearanceValidationSchema);

module.exports = ComprehensiveClearanceValidation;
