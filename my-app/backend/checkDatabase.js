const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";

async function checkDatabase() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB\n");

    // Get total count
    const total = await ClearanceWorkflow.countDocuments();
    console.log(`📊 Total Workflows: ${total}\n`);

    // Check for "In Progress" records
    const inProgress = await ClearanceWorkflow.find({ overallStatus: "In Progress" }).limit(5);
    console.log(`\n🔄 IN PROGRESS WORKFLOWS (${inProgress.length} shown):`);
    inProgress.forEach((w, i) => {
      console.log(`\n   Record ${i + 1}:`);
      console.log(`   • SAP: ${w.sapid}`);
      console.log(`   • Name: "${w.studentName}" (${typeof w.studentName})`);
      console.log(`   • Current Phase: ${w.currentPhase}`);
      console.log(`   • Overall Status: ${w.overallStatus}`);
      if (w.phases && w.phases.length > 1) {
        console.log(`   • Phase 0 (${w.phases[0].name}): ${w.phases[0].status || "UNDEFINED"}`);
        console.log(`   • Phase 1 (${w.phases[1].name}): ${w.phases[1].status || "UNDEFINED"}`);
      }
    });

    // Check for "Completed" records
    const completed = await ClearanceWorkflow.find({ overallStatus: "Completed" }).limit(5);
    console.log(`\n\n✅ COMPLETED WORKFLOWS (${completed.length} shown):`);
    completed.forEach((w, i) => {
      console.log(`\n   Record ${i + 1}:`);
      console.log(`   • SAP: ${w.sapid}`);
      console.log(`   • Name: "${w.studentName}" (${typeof w.studentName})`);
      console.log(`   • Overall Status: ${w.overallStatus}`);
      if (w.phases && w.phases.length > 0) {
        console.log(`   • Phase 0: ${w.phases[0].status || "UNDEFINED"}`);
        if (w.phases[1]) console.log(`   • Phase 1: ${w.phases[1].status || "UNDEFINED"}`);
      }
    });

    console.log("\n✅ Database check complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkDatabase();
