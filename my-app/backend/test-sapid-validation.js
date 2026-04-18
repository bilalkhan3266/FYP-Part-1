const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");
const DepartmentIssue = require("./models/DepartmentIssue");

require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

// Valid SAPIDs
const validSapids = [
  "35875", "45388", "46263", "46119", "46756", "47460", "35667", "32493", "45358", "36565",
  "44483", "48952", "48397", "49040", "47419", "46465", "47729", "46292", "45923", "47527",
  "44437", "44181", "46387", "46951", "46411", "44128", "47749", "44220", "44201", "38631",
  "46451", "45679", "44712", "43944"
];

async function testValidation() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🧪 Testing SAPID Validation System");
    console.log("═".repeat(70));

    // Test 1: Check that all valid SAPIDs have records
    console.log("\n✅ TEST 1: Valid SAPIDs Should Have Records");
    console.log("─".repeat(70));
    let validFound = 0;
    for (const sapid of validSapids.slice(0, 5)) { // Test first 5
      const record = await DepartmentIssue.findOne({ studentId: sapid });
      if (record) {
        console.log(`   ✅ SAPID ${sapid}: Found in database`);
        validFound++;
      } else {
        console.log(`   ❌ SAPID ${sapid}: NOT found (ERROR!)`);
      }
    }
    console.log(`   Result: ${validFound}/5 valid SAPIDs found\n`);

    // Test 2: Check that invalid SAPIDs do NOT have records
    console.log("✅ TEST 2: Invalid SAPIDs Should NOT Have Records");
    console.log("─".repeat(70));
    const invalidSapids = ["483970", "999999", "111111", "222222"];
    let invalidNotFound = 0;
    for (const sapid of invalidSapids) {
      const record = await DepartmentIssue.findOne({ studentId: sapid });
      if (!record) {
        console.log(`   ✅ SAPID ${sapid}: NOT found (CORRECT)`);
        invalidNotFound++;
      } else {
        console.log(`   ❌ SAPID ${sapid}: Found in database (ERROR!)`);
      }
    }
    console.log(`   Result: ${invalidNotFound}/${invalidSapids.length} invalid SAPIDs correctly blocked\n`);

    // Test 3: Check for orphaned clearance workflows
    console.log("✅ TEST 3: Check for Orphaned Workflows");
    console.log("─".repeat(70));
    const allWorkflows = await ClearanceWorkflow.find({});
    console.log(`   Total workflows in database: ${allWorkflows.length}`);
    
    let orphanedCount = 0;
    let validCount = 0;
    
    for (const workflow of allWorkflows) {
      const record = await DepartmentIssue.findOne({ studentId: workflow.sapid.toString() });
      if (!record) {
        orphanedCount++;
        console.log(`   ❌ Orphaned: SAPID ${workflow.sapid} (Status: ${workflow.overallStatus})`);
      } else {
        validCount++;
      }
    }
    
    console.log(`\n   Valid workflows: ${validCount}`);
    console.log(`   Orphaned workflows: ${orphanedCount}`);
    if (orphanedCount > 0) {
      console.log(`   ⚠️ WARNING: Found ${orphanedCount} workflows with invalid SAPIDs!\n`);
    } else {
      console.log(`   ✅ All workflows are valid!\n`);
    }

    // Test 4: Database Statistics
    console.log("✅ TEST 4: Database Statistics");
    console.log("─".repeat(70));
    const stats = {
      totalIssues: await DepartmentIssue.countDocuments(),
      libraryIssues: await DepartmentIssue.countDocuments({ departmentName: "Library" }),
      transportIssues: await DepartmentIssue.countDocuments({ departmentName: "Transport" }),
      coordinationIssues: await DepartmentIssue.countDocuments({ departmentName: "Coordination" }),
      feeIssues: await DepartmentIssue.countDocuments({ departmentName: "Fee Department" }),
      serviceIssues: await DepartmentIssue.countDocuments({ departmentName: "Student Service" }),
    };

    console.log(`   Total DepartmentIssue records: ${stats.totalIssues}`);
    console.log(`   ├─ Library: ${stats.libraryIssues}`);
    console.log(`   ├─ Transport: ${stats.transportIssues}`);
    console.log(`   ├─ Coordination: ${stats.coordinationIssues}`);
    console.log(`   ├─ Fee Department: ${stats.feeIssues}`);
    console.log(`   └─ Student Service: ${stats.serviceIssues}`);
    
    const expectedTotal = 34 * 5; // 34 SAPIDs × 5 departments
    console.log(`\n   Expected total: ${expectedTotal}`);
    if (stats.totalIssues === expectedTotal) {
      console.log(`   ✅ Database is correctly populated!\n`);
    } else {
      console.log(`   ⚠️ Database has ${stats.totalIssues} records, expected ${expectedTotal}\n`);
    }

    console.log("═".repeat(70));
    console.log("🎉 Testing completed!\n");

    if (validNotFound === invalidSapids.length && orphanedCount === 0 && stats.totalIssues === expectedTotal) {
      console.log("✅ All validation tests PASSED!");
      console.log("✅ The system is properly configured to block invalid SAPIDs!");
    } else {
      console.log("⚠️ Some tests failed. Please review the results above.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testValidation();
