const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/role_based_system";

mongoose.connect(MONGODB_URI).then(async () => {
  console.log("✅ Connected to MongoDB");
  
  // Get the ClearanceWorkflow model
  const db = mongoose.connection;
  const ClearanceWorkflow = db.collection("clearanceworkflows");
  
  // Count total documents
  const total = await ClearanceWorkflow.countDocuments();
  console.log(`\n📊 Total clearance workflows: ${total}`);
  
  // Look for approved records with phases
  const phaseIndex = 3; // Fee Department is phase 3
  const approvedQuery = {
    [`phases.${phaseIndex}.status`]: "Approved"
  };
  
  const approved = await ClearanceWorkflow.countDocuments(approvedQuery);
  console.log(`\n✅ Approved in phase ${phaseIndex}: ${approved}`);
  
  // Show sample documents
  const samples = await ClearanceWorkflow.find().limit(5).toArray();
  if (samples.length > 0) {
    console.log(`\n📄 Sample document structure:`);
    console.log(JSON.stringify(samples[0], null, 2).substring(0, 500) + "...");
  }
  
  // Show phases structure
  if (samples.length > 0 && samples[0].phases) {
    console.log(`\n📋 Phase structure in first document:`);
    samples[0].phases.forEach((phase, idx) => {
      console.log(`  Phase ${idx}: ${phase?.status || "N/A"}`);
    });
  }
  
  mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});
