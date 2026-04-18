require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const ComprehensiveClearanceValidation = require("./models/ComprehensiveClearanceValidation");
const { sendClearanceCertificateEmail } = require("./utils/emailService");

async function debugClearanceEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find the latest completed clearance
    const latestClearance = await ComprehensiveClearanceValidation.findOne({
      overallStatus: 'Completed',
      certificateGenerated: true
    }).sort({ completedAt: -1 });

    if (!latestClearance) {
      console.error("❌ No completed clearance found");
      process.exit(1);
    }

    console.log("\n📄 Latest Clearance Found:");
    console.log(`   ID: ${latestClearance._id}`);
    console.log(`   Student: ${latestClearance.student_name}`);
    console.log(`   SAP ID: ${latestClearance.sapid}`);
    console.log(`   Status: ${latestClearance.overallStatus}`);
    console.log(`   Certificate: ${latestClearance.certificateGenerated}`);
    console.log(`   Student User ID: ${latestClearance.student_id}`);

    // Get the student record
    const student = await User.findById(latestClearance.student_id);
    
    console.log("\n👤 Student Record:");
    if (student) {
      console.log(`   ✅ Student found`);
      console.log(`   ID: ${student._id}`);
      console.log(`   Name: ${student.full_name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Department: ${student.department}`);
      console.log(`   Role: ${student.role}`);
    } else {
      console.error(`   ❌ Student NOT found with ID: ${latestClearance.student_id}`);
      process.exit(1);
    }

    if (!student.email) {
      console.error(`   ❌ Student has NO EMAIL configured`);
      console.error(`   Please add email to student record`);
      process.exit(1);
    }

    // Test sending email
    console.log("\n📧 Testing Email Send...");
    const emailResult = await sendClearanceCertificateEmail({
      studentName: student.full_name || student.name,
      studentEmail: student.email,
      sapId: latestClearance.sapid,
      department: student.department || latestClearance.departmentStatuses?.[0]?.name || "N/A",
      program: latestClearance.program || "N/A",
      qrCode: latestClearance.qr_code || "CLEARANCE_TEST",
      approvedBy: "Debug Test",
      approvedAt: new Date(),
      departments: latestClearance.departmentStatuses || []
    });

    console.log("\n📨 Email Result:");
    console.log(`   Success: ${emailResult.success}`);
    if (emailResult.success) {
      console.log(`   ✅ Message ID: ${emailResult.messageId}`);
      console.log(`   Email should have been sent!`);
    } else {
      console.error(`   ❌ Failed: ${emailResult.reason || emailResult.error}`);
    }

    await mongoose.connection.close();
    process.exit(emailResult.success ? 0 : 1);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

debugClearanceEmail();
