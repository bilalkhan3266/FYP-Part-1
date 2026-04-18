const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";

async function checkAll() {
  try {
    await mongoose.connect(uri);
    const all = await ClearanceWorkflow.find({}).sort({ createdAt: -1 });
    console.log(`Total records: ${all.length}\n`);
    
    all.forEach((w, i) => {
      const phaseStates = w.phases.map(p => p.status).join(", ");
      console.log(`${i+1}. SAP: ${w.sapid} | Name: "${w.studentName}" | Status: ${w.overallStatus} | Phases: [${phaseStates}]`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkAll();
