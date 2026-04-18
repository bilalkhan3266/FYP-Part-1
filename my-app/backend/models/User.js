const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  sap: { type: String, default: null },
  department: { type: String, default: null },
  autoClearanceEnabled: { type: Boolean, default: false },
  // Student clearance info
  father_name: { type: String, default: null },
  program: { type: String, default: null },
  semester: { type: String, default: null },
  degree_status: { type: String, default: null }
}, { timestamps: true });

// Prevent model overwrite
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
