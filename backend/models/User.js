const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  sap: { type: String, required: true },
  department: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Prevent model overwrite
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
