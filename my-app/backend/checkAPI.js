const axios = require("axios");

// Simulate API call to check what's being returned
async function checkAPI() {
  try {
    // We need a valid token - let's use a library user token
    // For testing, we'll just check the database directly instead
    
    const mongoose = require("mongoose");
    const ClearanceWorkflow = require("./models/ClearanceWorkflow");
    
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";
    await mongoose.connect(uri);
    
    console.log("🔍 Checking what API would return for Library department:\n");
    
    // Simulate what the endpoint returns
    // Library phase index = 1
    const phaseIndex = 1;
    
    // Completed workflows
    const completed = await ClearanceWorkflow.find({ overallStatus: "Completed" });
    console.log(`✅ Completed workflows: ${completed.length}`);
    
    // This phase approved
    const thisPhaseApproved = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      [`phases.${phaseIndex}.status`]: "Approved"
    });
    console.log(`✅ This phase (Library) approved: ${thisPhaseApproved.length}`);
    
    // Expected approved response
    const expectedApproved = [...completed, ...thisPhaseApproved];
    console.log(`\n📊 Expected Approved array size: ${expectedApproved.length}`);
    
    // Current in progress
    const pending = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      currentPhase: phaseIndex
    });
    console.log(`📌 Pending (current phase): ${pending.length}`);
    
    console.log("\n✅ Expected API response:");
    console.log(`   • Approved: ${expectedApproved.length}`);
    console.log(`   • Pending: ${pending.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkAPI();
