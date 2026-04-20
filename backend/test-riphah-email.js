/**
 * Test OTP email delivery to riphah.edu.pk domain
 * Tests with specific user email and monitors delivery
 */

require("dotenv").config();
const { sendOtpEmail } = require("./utils/emailService");

async function testRiphahEmailDelivery() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 RIPHAH DOMAIN EMAIL DELIVERY TEST");
  console.log("=".repeat(70) + "\n");

  // Test email configurations
  const testEmails = [
    {
      email: "48397@students.riphah.edu.pk",
      name: "Test Student (Riphah Domain)",
    },
    {
      email: process.env.EMAIL_USER,
      name: "Admin Email (Gmail)",
    }
  ];

  console.log("📋 Testing Email Configuration:");
  console.log(`   • Service: ${process.env.EMAIL_SERVICE || "gmail"}`);
  console.log(`   • From: ${process.env.EMAIL_USER}`);
  console.log(`   • Using: Connection pooling enabled\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const testCase of testEmails) {
    console.log(`\n📧 Test: ${testCase.name}`);
    console.log(`   To: ${testCase.email}`);

    const testOTP = Math.random().toString().slice(2, 8);
    console.log(`   OTP: ${testOTP}`);

    try {
      const startTime = Date.now();
      
      const result = await sendOtpEmail({
        userName: testCase.name,
        userEmail: testCase.email,
        otp: testOTP,
        expiresInMinutes: 5
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ SUCCESS in ${duration}ms`);
        console.log(`   📬 Message ID: ${result.messageId}`);
        successCount++;
      } else {
        console.error(`   ❌ FAILED: ${result.reason || result.error}`);
        failureCount++;
      }
    } catch (err) {
      console.error(`   ❌ ERROR: ${err.message}`);
      failureCount++;
    }

    // Small delay between tests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST RESULTS");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log("=".repeat(70) + "\n");

  if (failureCount > 0) {
    console.log("⚠️  TROUBLESHOOTING SUGGESTIONS:");
    console.log("   1. Check if EMAIL_USER and EMAIL_PASS are set in .env");
    console.log("   2. For riphah.edu.pk emails:");
    console.log("      • Ensure Gmail account allows 'Less secure app access'");
    console.log("      • Check Gmail spam folder for test emails");
    console.log("      • Try resetting Gmail app password in security settings");
    console.log("   3. Check email firewall/filtering at Riphah level");
    console.log("   4. Monitor: gmail.com/u/0/?tab=mvm#all");
    console.log("");
  }

  process.exit(failureCount > 0 ? 1 : 0);
}

testRiphahEmailDelivery();
