const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  sap: { type: String, required: true },
  department: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // auto-delete after 10 min
});

const PendingUser = mongoose.models.PendingUser || mongoose.model("PendingUser", pendingUserSchema);

module.exports = PendingUser;
