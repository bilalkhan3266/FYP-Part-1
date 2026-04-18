const mongoose = require("mongoose");
const DepartmentIssue = require("./models/DepartmentIssue");

require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

// List of SAPIDs to create issues for
const sapidList = [
  35875, 45388, 46263, 46119, 46756, 47460, 35667, 32493, 45358, 36565,
  44483, 48952, 48397, 49040, 47419, 46465, 47729, 46292, 45923, 47527,
  44437, 44181, 46387, 46951, 46411, 44128, 47749, 44220, 44201, 38631,
  46451, 45679, 44712, 43944
];

// Different coordination issue messages for variety
const coordinationMessages = [
  (sapid) => `Student SAPID ${sapid} has incomplete documentation. Please submit required coordination documents and complete the verification process.`,
  (sapid) => `SAPID ${sapid}: Administrative documents pending. Student must provide missing forms and certificates to coordination office.`,
  (sapid) => `Coordination clearance required for SAPID ${sapid}. Document verification incomplete. Coordinate with student for submission.`,
  (sapid) => `SAPID ${sapid} has unresolved coordination issues. Student needs to clear all pending administrative matters and documentation.`,
  (sapid) => `Student ID ${sapid}: Coordination approval pending. Must submit required documents and certificates for final verification.`,
  (sapid) => `SAPID ${sapid} - Coordination clearance pending. Student should visit coordination office for document review and approval.`,
  (sapid) => `Outstanding coordination issues for SAPID ${sapid}. Administrative clearance required as part of degree clearance process.`,
  (sapid) => `SAPID ${sapid}: Documentation not finalized. Student requires coordination clearance to proceed with graduation.`,
];

// Get varied message for each SAPID
function getIssueMessage(sapid, index) {
  return coordinationMessages[index % coordinationMessages.length](sapid);
}

// Connect to MongoDB
async function seedCoordinationIssues() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log("📋 Creating Coordination Issue Records");
    console.log("═".repeat(70));

    let successCount = 0;
    let errorCount = 0;

    // Create an issue for each SAPID
    for (let index = 0; index < sapidList.length; index++) {
      const sapid = sapidList[index];
      try {
        const issue = new DepartmentIssue({
          studentId: sapid.toString(),
          departmentName: "Coordination",
          itemType: "Administrative Documents",
          description: getIssueMessage(sapid, index),
          issueDate: new Date(),
          status: "Issued",
          issuedByName: "System Admin",
        });

        await issue.save();
        console.log(`✅ Issue created for SAPID: ${sapid}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to create issue for SAPID ${sapid}: ${err.message}`);
        errorCount++;
      }
    }

    console.log("\n" + "═".repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} issues`);
    console.log(`   ❌ Failed: ${errorCount} issues`);
    console.log(`   📈 Total: ${sapidList.length} SAPIDs processed\n`);

    // Display all created issues
    const allIssues = await DepartmentIssue.find({ 
      departmentName: "Coordination",
      studentId: { $in: sapidList.map(s => s.toString()) }
    }).sort({ createdAt: -1 });

    console.log(`📋 Total Coordination Issues in Database: ${allIssues.length}\n`);

    if (allIssues.length > 0) {
      console.log("Recent Issues:");
      console.log("─".repeat(70));
      allIssues.slice(0, 10).forEach((issue, idx) => {
        console.log(`${idx + 1}. SAPID: ${issue.studentId}`);
        console.log(`   Description: ${issue.description.substring(0, 50)}...`);
        console.log(`   Status: ${issue.status}`);
        console.log(`   Created: ${issue.createdAt.toLocaleString()}`);
        console.log();
      });
    }

    console.log("✅ Coordination issue seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  }
}

// Run the seed function
seedCoordinationIssues();
