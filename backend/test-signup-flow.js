/**
 * Test OTP signup flow for specific user
 * Simulates exactly what happens during user signup
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { sendOtpEmail } = require("./utils/emailService");

// Import models
const PendingUser = require("./models/PendingUser");

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clearance";

async function testSignupFlow() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 OTP SIGNUP FLOW TEST - 48397@students.riphah.edu.pk");
  console.log("=".repeat(70) + "\n");

  try {
    // Connect to database
    console.log("📊 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const testEmail = "48397@students.riphah.edu.pk";
    const testName = "Test Student";

    console.log("📋 Test Case: Simulating user signup");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: ${testName}\n`);

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    console.log(`🔐 Generated OTP: ${otp}`);
    console.log(`⏰ Expires at: ${otpExpiry.toLocaleTimeString()}\n`);

    // Save to PendingUser
    console.log("💾 Saving to PendingUser...");
    await PendingUser.findOneAndUpdate(
      { email: testEmail },
      {
        full_name: testName,
        email: testEmail,
        password: "hashedPassword123",
        sap: "48397",
        department: "engineering",
        otp,
        otpExpiry,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log("✅ PendingUser saved\n");

    // Send OTP email
    console.log("📧 Sending OTP email...");
    const startTime = Date.now();
    
    const result = await sendOtpEmail({
      userName: testName,
      userEmail: testEmail,
      otp,
      expiresInMinutes: 5
    });

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ Email sent successfully in ${duration}ms`);
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.error(`❌ Email failed: ${result.reason || result.error}\n`);
    }

    // Verify database entry
    console.log("🔍 Verifying PendingUser in database...");
    const saved = await PendingUser.findOne({ email: testEmail });
    if (saved) {
      console.log("✅ Found in database:");
      console.log(`   Email: ${saved.email}`);
      console.log(`   OTP: ${saved.otp}`);
      console.log(`   Expires: ${saved.otpExpiry.toLocaleTimeString()}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("TEST COMPLETE");
    console.log("=".repeat(70) + "\n");

    console.log("📝 What to check:");
    console.log("   1. Check if email arrives at 48397@students.riphah.edu.pk");
    console.log("   2. Check all folders: Inbox, Spam, Junk, Promotions");
    console.log("   3. Verify OTP matches in database:");
    console.log(`       Expected OTP: ${otp}`);
    console.log("   4. If email doesn't arrive, contact Riphah IT\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testSignupFlow();
