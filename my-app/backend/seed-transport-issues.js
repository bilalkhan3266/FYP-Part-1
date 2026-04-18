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

// Different transport issue messages for variety
const transportMessages = [
  (sapid) => `Student SAPID ${sapid} has outstanding transport dues. Please complete the transport clearance process and settle all arrears.`,
  (sapid) => `SAPID ${sapid}: Transport pass expiration or renewal required. Student must update transport records before degree completion.`,
  (sapid) => `Transport clearance required for SAPID ${sapid}. Pending transport fee payments. Coordinate with transport office for settlement.`,
  (sapid) => `SAPID ${sapid} has unresolved transport records. Student needs to clear all pending transport matters and outstanding fees.`,
  (sapid) => `Student ID ${sapid}: Transport services suspended due to pending clearance. Must settle transport dues for reinstatement.`,
  (sapid) => `SAPID ${sapid} - Transport clearance pending. Student should visit transport office for final verification and document renewal.`,
  (sapid) => `Outstanding transport issues for SAPID ${sapid}. Coordinate transport clearance as part of degree clearance process.`,
  (sapid) => `SAPID ${sapid}: Transport arrears not settled. Student requires transport clearance to proceed with graduation.`,
];

// Get varied message for each SAPID
function getIssueMessage(sapid, index) {
  return transportMessages[index % transportMessages.length](sapid);
}

// Connect to MongoDB
async function seedTransportIssues() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🚌 Creating Transport Issue Records");
    console.log("═".repeat(70));

    let successCount = 0;
    let errorCount = 0;

    // Create an issue for each SAPID
    for (let index = 0; index < sapidList.length; index++) {
      const sapid = sapidList[index];
      try {
        const issue = new DepartmentIssue({
          studentId: sapid.toString(),
          departmentName: "Transport",
          itemType: "Transport Services",
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
      departmentName: "Transport",
      studentId: { $in: sapidList.map(s => s.toString()) }
    }).sort({ createdAt: -1 });

    console.log(`📋 Total Transport Issues in Database: ${allIssues.length}\n`);

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

    console.log("✅ Transport issue seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  }
}

// Run the seed function
seedTransportIssues();
