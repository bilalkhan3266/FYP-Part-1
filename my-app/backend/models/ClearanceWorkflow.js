const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      "Coordination",
      "Library",
      "Transport",
      "Fee Department",
      "Student Service",
    ],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approverName: { type: String, default: "" },
  remarks: { type: String, default: "" },
  approvedAt: { type: Date, default: null },
}, { _id: false });

const clearanceWorkflowSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  sapid: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  registrationNo: { type: String, required: true },
  fatherName: { type: String, required: true },
  program: { type: String, required: true },
  semester: { type: String, required: true },
  degreeStatus: { type: String, required: true },
  department: { type: String, default: "" },

  overallStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Rejected"],
    default: "Pending",
    index: true,
  },
  currentPhase: {
    type: Number,
    default: 0, // index into phases array
    min: 0,
    max: 4,
  },
  phases: {
    type: [phaseSchema],
    default: () => [
      { name: "Coordination", status: "Pending" },
      { name: "Library", status: "Pending" },
      { name: "Transport", status: "Pending" },
      { name: "Fee Department", status: "Pending" },
      { name: "Student Service", status: "Pending" },
    ],
  },

  qrCode: { type: String, default: null },
  certificateUrl: { type: String, default: null },

  submittedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Virtual: progress percentage
clearanceWorkflowSchema.virtual("progressPercentage").get(function () {
  const approved = this.phases.filter((p) => p.status === "Approved").length;
  return Math.round((approved / this.phases.length) * 100);
});

// Virtual: current phase name
clearanceWorkflowSchema.virtual("currentPhaseName").get(function () {
  if (this.overallStatus === "Completed") return "Completed";
  if (this.overallStatus === "Rejected") return "Rejected";
  return this.phases[this.currentPhase]?.name || "Unknown";
});

clearanceWorkflowSchema.set("toJSON", { virtuals: true });
clearanceWorkflowSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ClearanceWorkflow", clearanceWorkflowSchema);
