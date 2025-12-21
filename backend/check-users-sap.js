const mongoose = require("mongoose");
const User = require("./models/User");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/student_clearance";

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check all users
    const allUsers = await User.find({});
    console.log(`📊 Total users: ${allUsers.length}\n`);

    // Check library users specifically
    const libraryUsers = await User.find({ role: /^library$/i });
    console.log(`📚 Library users: ${libraryUsers.length}`);
    libraryUsers.forEach(u => {
      console.log(`  - ${u.full_name} (SAP: ${u.sap || "NULL"})`);
    });

    // Check all department users
    const deptUsers = await User.find({
      role: { $regex: /^(library|transport|laboratory|feedepartment|coordination|studentservice)$/i }
    });
    console.log(`\n👥 Total department users: ${deptUsers.length}`);
    deptUsers.forEach(u => {
      console.log(`  - ${u.full_name} (Role: ${u.role}, SAP: ${u.sap || "NULL"})`);
    });

    // Check admin users
    const adminUsers = await User.find({ role: "admin" });
    console.log(`\n🔑 Admin users: ${adminUsers.length}`);
    adminUsers.forEach(u => {
      console.log(`  - ${u.full_name} (SAP: ${u.sap || "NULL"})`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

checkUsers();
