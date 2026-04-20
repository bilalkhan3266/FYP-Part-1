/**
 * Test script to verify OTP email sending
 * Run with: node test-otp-email.js
 */

require("dotenv").config();
const { sendOtpEmail } = require("./utils/emailService");

async function testOTPEmail() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 OTP EMAIL SENDING TEST");
  console.log("=".repeat(60) + "\n");

  // Check environment configuration
  console.log("📋 Checking email configuration:");
  console.log(`   • EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || "❌ NOT SET"}`);
  console.log(`   • EMAIL_USER: ${process.env.EMAIL_USER || "❌ NOT SET"}`);
  console.log(`   • EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅ SET" : "❌ NOT SET"}`);
  console.log();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email configuration incomplete. Please set EMAIL_USER and EMAIL_PASS in .env");
    process.exit(1);
  }

  // Test email address (change this to test with your email)
  const testEmail = process.env.EMAIL_USER; // Send to configured email
  const testOTP = Math.random().toString().slice(2, 8); // 6-digit OTP

  console.log(`📧 Sending test OTP to: ${testEmail}`);
  console.log(`📝 Test OTP: ${testOTP}\n`);

  let result;
  try {
    result = await sendOtpEmail({
      userName: "Test User",
      userEmail: testEmail,
      otp: testOTP,
      expiresInMinutes: 5
    });

    if (result.success) {
      console.log(`\n✅ SUCCESS! Email sent successfully`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log("\n📩 Please check your email inbox for the test OTP message.");
    } else {
      console.error(`\n❌ FAILED! Could not send email`);
      console.error(`   Reason: ${result.reason || result.error}`);
    }
  } catch (err) {
    console.error(`\n❌ ERROR during test:`);
    console.error(`   ${err.message}`);
    console.error(`\n📋 Full error:`, err);
  }

  console.log("\n" + "=".repeat(60) + "\n");
  process.exit(result?.success ? 0 : 1);
}

// Run test
testOTPEmail();
