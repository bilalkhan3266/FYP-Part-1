// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, role, sap, department } = req.body;

    if (!full_name || !email || !password || !role || !sap || !department) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ success: false, message: "Email already exists" });

    const existingSAP = await User.findOne({ sap });
    if (existingSAP) return res.status(400).json({ success: false, message: "SAP ID already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ full_name, email: email.toLowerCase(), password: hashedPassword, role, sap, department });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || "secret_key", { expiresIn: process.env.JWT_EXPIRE || "24h" });

    res.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        sap: newUser.sap,
        department: newUser.department
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret_key", { expiresIn: process.env.JWT_EXPIRE || "24h" });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        sap: user.sap,
        department: user.department
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};
