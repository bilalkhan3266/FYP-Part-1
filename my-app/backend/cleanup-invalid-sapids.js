const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");
const DepartmentIssue = require("./models/DepartmentIssue");

require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

// List of VALID SAPIDs only
const validSapids = [
  "35875", "45388", "46263", "46119", "46756", "47460", "35667", "32493", "45358", "36565",
  "44483", "48952", "48397", "49040", "47419", "46465", "47729", "46292", "45923", "47527",
  "44437", "44181", "46387", "46951", "46411", "44128", "47749", "44220", "44201", "38631",
  "46451", "45679", "44712", "43944"
];

async function cleanupInvalidRecords() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🧹 Cleaning up Invalid SAPID Records");
    console.log("═".repeat(70));

    // Find and delete clearance workflows with invalid SAPIDs
    console.log("\n📋 Checking ClearanceWorkflow collection...");
    const invalidWorkflows = await ClearanceWorkflow.find({
      sapid: { $nin: validSapids }
    });

    console.log(`   Found ${invalidWorkflows.length} workflows with invalid SAPIDs`);
    if (invalidWorkflows.length > 0) {
      console.log("   Invalid SAPIDs found:");
      invalidWorkflows.forEach(w => {
        console.log(`     - ${w.sapid} (Status: ${w.overallStatus})`);
      });

      const workflowDeleteResult = await ClearanceWorkflow.deleteMany({
        sapid: { $nin: validSapids }
      });
      console.log(`   ✅ Deleted ${workflowDeleteResult.deletedCount} invalid workflows\n`);
    } else {
      console.log("   ✅ No invalid workflows found\n");
    }

    // Find and delete department issues with invalid SAPIDs
    console.log("📋 Checking DepartmentIssue collection...");
    const invalidIssues = await DepartmentIssue.find({
      studentId: { $nin: validSapids }
    });

    console.log(`   Found ${invalidIssues.length} issues with invalid SAPIDs`);
    if (invalidIssues.length > 0) {
      console.log("   Invalid SAPIDs found:");
      invalidIssues.forEach(issue => {
        console.log(`     - ${issue.studentId} (Department: ${issue.departmentName})`);
      });

      const issueDeleteResult = await DepartmentIssue.deleteMany({
        studentId: { $nin: validSapids }
      });
      console.log(`   ✅ Deleted ${issueDeleteResult.deletedCount} invalid issues\n`);
    } else {
      console.log("   ✅ No invalid issues found\n");
    }

    // Verify only valid SAPIDs remain
    console.log("✅ Verification After Cleanup:");
    console.log("─".repeat(70));
    const remainingWorkflows = await ClearanceWorkflow.countDocuments();
    const remainingIssues = await DepartmentIssue.countDocuments();
    
    console.log(`   ClearanceWorkflow records: ${remainingWorkflows}`);
    console.log(`   DepartmentIssue records: ${remainingIssues}`);
    
    // Expected count: 34 SAPIDs × 5 departments = 170 issues
    const expectedIssues = 34 * 5;
    console.log(`   Expected issues: ${expectedIssues}`);
    
    if (remainingIssues === expectedIssues) {
      console.log("   ✅ Record count matches expected value!\n");
    } else {
      console.log(`   ⚠️ Warning: Expected ${expectedIssues} issues, found ${remainingIssues}\n`);
    }

    console.log("🎉 Cleanup completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

cleanupInvalidRecords();
