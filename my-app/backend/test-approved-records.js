const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";

async function verifyApprovedRecords() {
  try {
    console.log("🔌 Connecting to MongoDB...\n");
    await mongoose.connect(mongoURI);

    // Check completed clearances
    const completed = await ClearanceWorkflow.find({ overallStatus: "Completed" });
    console.log(`📊 Total Completed Clearances: ${completed.length}\n`);

    if (completed.length > 0) {
      console.log("✅ Completed Clearances (will appear in Approved tab for ALL departments):");
      completed.forEach(c => {
        console.log(`   • SAP: ${c.sapid} | Student: ${c.studentName}`);
        console.log(`     Completed: ${c.completedAt?.toLocaleDateString()}`);
        console.log(`     Phases approved: ${c.phases.filter(p => p.status === "Approved").length}/5\n`);
      });
    }

    // Check in-progress clearances with approved phases
    const inProgress = await ClearanceWorkflow.find({ 
      overallStatus: "In Progress",
      "phases.status": "Approved"
    });
    
    console.log(`📋 In-Progress Clearances (with partial approvals): ${inProgress.length}\n`);
    
    if (inProgress.length > 0) {
      console.log("This request appears in Approved tab for departments that already approved:");
      inProgress.forEach(ip => {
        const approved = ip.phases.filter(p => p.status === "Approved");
        console.log(`   • SAP: ${ip.sapid} | Approved by: ${approved.map(p => p.name).join(", ")}\n`);
      });
    }

    console.log("\n✨ Test complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

verifyApprovedRecords();
