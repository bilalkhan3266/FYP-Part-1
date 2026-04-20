/**
 * Diagnostic Tool for 500 Error on Clearance Request Submission
 * 
 * This script helps identify why the form submission returns a 500 error
 * Run this to test the clearance submission flow and identify issues
 */

require("dotenv").config();
const mongoose = require("mongoose");
const DepartmentIssue = require("./models/DepartmentIssue");
const ComprehensiveClearanceValidation = require("./models/ComprehensiveClearanceValidation");
const DepartmentClearance = require("./models/DepartmentClearance");
const { validateStudentClearanceAllDepartments } = require("./utils/clearanceValidator");

const testSapId = "48397"; // Replace with actual SAP ID from error

async function runDiagnostics() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/clearance_system");
    console.log("✅ MongoDB connected");

    console.log("\n📋 DIAGNOSTIC TEST STARTED");
    console.log(`   Testing SAP ID: ${testSapId}`);

    // Step 1: Check if SAPID exists in DepartmentIssue
    console.log("\n1️⃣ Checking DepartmentIssue collection...");
    const issueRecord = await DepartmentIssue.findOne({ studentId: testSapId });
    if (issueRecord) {
      console.log(`   ✅ Found: ${issueRecord.departmentName}`);
      console.log(`   Status: ${issueRecord.status}`);
    } else {
      console.log(`   ❌ NOT FOUND: ${testSapId} not in DepartmentIssue`);
      console.log(`   ⚠️  This is likely the cause of the 500 error`);
      
      // Check what SAP IDs do exist
      const allSapIds = await DepartmentIssue.distinct("studentId");
      console.log(`   Available SAP IDs: ${allSapIds.slice(0, 5).join(", ")}...`);
    }

    // Step 2: Try the validation function
    console.log("\n2️⃣ Testing validateStudentClearanceAllDepartments...");
    try {
      const result = await validateStudentClearanceAllDepartments(testSapId, {
        student_name: "Test Student",
        father_name: "Test Father",
        program: "BS",
        semester: "1",
        degree_status: "Undergraduate"
      });
      console.log("   ✅ Validation function executed");
      console.log(`   Overall Status: ${result.overallStatus}`);
      console.log(`   Department Statuses:`);
      result.departmentStatuses.forEach(dept => {
        console.log(`     - ${dept.name}: ${dept.status}`);
      });
    } catch (err) {
      console.log(`   ❌ Validation function failed: ${err.message}`);
    }

    // Step 3: Check ComprehensiveClearanceValidation
    console.log("\n3️⃣ Checking ComprehensiveClearanceValidation collection...");
    const validationRecords = await ComprehensiveClearanceValidation.find({ sapid: testSapId });
    console.log(`   Found ${validationRecords.length} records`);
    if (validationRecords.length > 0) {
      console.log(`   Latest: ${validationRecords[0].overallStatus}`);
    }

    // Step 4: Check DepartmentClearance
    console.log("\n4️⃣ Checking DepartmentClearance collection...");
    const deptRecords = await DepartmentClearance.find({ sapid: testSapId });
    console.log(`   Found ${deptRecords.length} records`);
    deptRecords.forEach(rec => {
      console.log(`   - ${rec.department_name}: ${rec.status}`);
    });

    console.log("\n✅ DIAGNOSTIC COMPLETE");

  } catch (err) {
    console.error("\n❌ DIAGNOSTIC ERROR:");
    console.error("   Error:", err.message);
    console.error("   Stack:", err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Run diagnostics
runDiagnostics().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
