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

// Different issue messages for variety
const issueMessages = [
  (sapid) => `Student SAPID ${sapid} has outstanding library book returns. Please complete the library clearance process and arrange book returns.`,
  (sapid) => `SAPID ${sapid}: Late return fees pending. Student must settle library dues before degree completion.`,
  (sapid) => `Library clearance required for SAPID ${sapid}. Multiple book returns overdue. Coordinate with library staff for resolution.`,
  (sapid) => `SAPID ${sapid} has unresolved library records. Student needs to clear all pending library matters.`,
  (sapid) => `Student ID ${sapid}: Library access restricted due to pending clearance. Must complete book returns and payments.`,
  (sapid) => `SAPID ${sapid} - Library clearance pending. Student should visit library counter for final verification.`,
  (sapid) => `Outstanding library issues for SAPID ${sapid}. Coordinate library clearance as part of degree clearance process.`,
  (sapid) => `SAPID ${sapid}: Library materials not returned. Student requires library clearance to proceed with graduation.`,
];

// Get varied message for each SAPID
function getIssueMessage(sapid, index) {
  return issueMessages[index % issueMessages.length](sapid);
}

// Connect to MongoDB
async function seedLibraryIssues() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log("📚 Creating Library Issue Records");
    console.log("═".repeat(70));

    let successCount = 0;
    let errorCount = 0;

    // Create an issue for each SAPID
    for (let index = 0; index < sapidList.length; index++) {
      const sapid = sapidList[index];
      try {
        const issue = new DepartmentIssue({
          studentId: sapid.toString(),
          departmentName: "Library",
          itemType: "Library Books",
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
      departmentName: "Library",
      studentId: { $in: sapidList.map(s => s.toString()) }
    }).sort({ createdAt: -1 });

    console.log(`📋 Total Library Issues in Database: ${allIssues.length}\n`);

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

    console.log("✅ Library issue seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  }
}

// Run the seed function
seedLibraryIssues();
