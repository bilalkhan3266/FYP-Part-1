require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("═══════════════════════════════════════════════════════");
console.log("📧 EMAIL CONFIGURATION TEST");
console.log("═══════════════════════════════════════════════════════");

// Check .env configuration
console.log("\n✓ Environment Variables:");
console.log(`  EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || "Not set"}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || "Not set"}`);
console.log(`  EMAIL_PASS: ${process.env.EMAIL_PASS ? "***SET***" : "Not set"}`);
console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || "Not set"}`);

// Check if credentials are present
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("\n❌ ERROR: Email credentials not configured in .env");
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test SMTP connection
console.log("\n🔗 Testing SMTP Connection...");
transporter.verify((err, success) => {
  if (err) {
    console.error(`❌ SMTP Connection FAILED:`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error("\n⚠️  TROUBLESHOOTING TIPS:");
    console.error("   1. For Gmail: Use an 'App Password', not your regular password");
    console.error("   2. Generate App Password at: https://myaccount.google.com/apppasswords");
    console.error("   3. Enable 'Less secure app access' if using personal account");
    console.error("   4. Check your firewall/antivirus isn't blocking SMTP port 587");
    process.exit(1);
  } else {
    console.log("✅ SMTP Connection SUCCESSFUL");
    
    // Send test email
    console.log("\n📨 Sending test email...");
    const testEmail = {
      from: `"Clearance System Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "🧪 Clearance System Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a3a52;">Email Configuration Test</h2>
          <p style="color: #555; line-height: 1.6;">
            If you received this email, your clearance system's email configuration is working correctly!
          </p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>Email Service:</strong> ${process.env.EMAIL_SERVICE}<br>
              <strong>From Email:</strong> ${process.env.EMAIL_USER}<br>
              <strong>Test Time:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          <p style="color: #666; font-size: 12px;">
            This is an automated test from the Riphah Clearance System.
          </p>
        </div>
      `,
    };

    transporter.sendMail(testEmail, (err, info) => {
      if (err) {
        console.error(`❌ Email sending FAILED:`);
        console.error(`   Error: ${err.message}`);
        process.exit(1);
      } else {
        console.log(`✅ Test email SENT successfully`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("✅ EMAIL CONFIGURATION IS WORKING!");
        console.log("═══════════════════════════════════════════════════════\n");
        process.exit(0);
      }
    });
  }
});
