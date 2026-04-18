const mongoose = require("mongoose");
const DepartmentIssue = require("./models/DepartmentIssue");

require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

// List of valid SAPIDs
const validSapids = [
  35875, 45388, 46263, 46119, 46756, 47460, 35667, 32493, 45358, 36565,
  44483, 48952, 48397, 49040, 47419, 46465, 47729, 46292, 45923, 47527,
  44437, 44181, 46387, 46951, 46411, 44128, 47749, 44220, 44201, 38631,
  46451, 45679, 44712, 43944
];

// Test SAPID
const testSapid = "483970";

async function verifyDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // Count total issues
    const totalIssues = await DepartmentIssue.countDocuments();
    console.log(`📊 Total DepartmentIssue records in database: ${totalIssues}\n`);

    // Count by department
    console.log("📋 Issues by Department:");
    console.log("─".repeat(70));
    const departments = ["Library", "Transport", "Coordination", "Fee Department", "Student Service"];
    for (const dept of departments) {
      const count = await DepartmentIssue.countDocuments({ departmentName: dept });
      console.log(`   ${dept}: ${count} records`);
    }
    console.log();

    // Check for valid SAPIDs
    console.log("✅ Checking Valid SAPIDs:");
    console.log("─".repeat(70));
    let validCount = 0;
    for (const sapid of validSapids) {
      const record = await DepartmentIssue.findOne({ studentId: sapid.toString() });
      if (record) {
        validCount++;
      }
    }
    console.log(`   Valid SAPIDs found: ${validCount}/${validSapids.length}\n`);

    // Check for test SAPID
    console.log(`🔍 Checking Test SAPID: "${testSapid}"`);
    console.log("─".repeat(70));
    const testRecord = await DepartmentIssue.findOne({ studentId: testSapid });
    if (testRecord) {
      console.log(`   ❌ FOUND: ${testSapid} exists in database!`);
      console.log(`   Department: ${testRecord.departmentName}`);
      console.log(`   Description: ${testRecord.description}`);
      console.log(`   Status: ${testRecord.status}`);
      console.log(`\n   ⚠️ This SAPID should NOT be in the database!\n`);
    } else {
      console.log(`   ✅ CORRECT: ${testSapid} NOT found in database`);
      console.log(`   This SAPID will be blocked during clearance submission\n`);
    }

    // Show sample valid records
    console.log("📝 Sample Valid SAPID Records:");
    console.log("─".repeat(70));
    const samples = await DepartmentIssue.find({ studentId: { $in: validSapids.slice(0, 5).map(s => s.toString()) } })
      .sort({ createdAt: -1 })
      .limit(5);
    
    samples.forEach((issue, idx) => {
      console.log(`${idx + 1}. SAPID: ${issue.studentId}`);
      console.log(`   Department: ${issue.departmentName}`);
      console.log(`   Status: ${issue.status}`);
      console.log();
    });

    console.log("✅ Verification completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

verifyDatabase();
