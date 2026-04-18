const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentSapId: {
      type: String,
      required: true,
      index: true
    },
    studentName: String,
    
    department: {
      type: String,
      enum: ["Library", "Fee & Dues", "Student Services", "Laboratory", "Coordination Office", "Transport", "Hostel Mess"],
      required: true,
      index: true
    },
    
    submissionType: {
      type: String,
      enum: ["document", "fee_proof", "lab_completion", "transport_form", "hostel_form", "attendance", "other"],
      default: "document"
    },
    
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    
    description: String,
    
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "in_review"],
      default: "pending",
      index: true
    },
    
    comments: String,
    rejectionReason: String,
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: Date,
    
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    updatedAt: {
      type: Date,
      default: Date.now
    },
    
    rejectionCount: {
      type: Number,
      default: 0
    },
    
    resubmittedAt: Date
  },
  { timestamps: true }
);

// Create indexes for fast queries
submissionSchema.index({ studentSapId: 1, department: 1 });
submissionSchema.index({ department: 1, status: 1 });
submissionSchema.index({ studentId: 1, status: 1 });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
