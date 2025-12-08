import mongoose from "mongoose";

const departmentStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["Pending", "Cleared", "Rejected", "Not Applicable"],
    default: "Pending"
  },
  remarks: { type: String, default: "" }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  from: { type: String, enum: ["student", "department"], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  to: { type: String, required: true }, // department name or "student"
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const clearanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  departmentStatuses: {
    fee: departmentStatusSchema,
    library: departmentStatusSchema,
    studentServices: departmentStatusSchema,
    laboratory: departmentStatusSchema,
    coordination: departmentStatusSchema,
    transport: departmentStatusSchema,
    hostel: departmentStatusSchema
  },
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model("Clearance", clearanceSchema);
