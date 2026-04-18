const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");
const ComprehensiveClearanceValidation = require("./models/ComprehensiveClearanceValidation");
const Message = require("./models/Message");

require("dotenv").config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

// SAPID to remove (the invalid one that was already approved)
const invalidSapid = "1234";

async function removeInvalidApprovedSapid() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    console.log(`🗑️ Removing Invalid SAPID: ${invalidSapid}`);
    console.log("═".repeat(70));

    // Find and delete from ClearanceWorkflow
    console.log(`\n📋 Checking ClearanceWorkflow collection for SAPID ${invalidSapid}...`);
    const workflows = await ClearanceWorkflow.find({ sapid: invalidSapid });
    console.log(`   Found: ${workflows.length} workflow(s)`);
    
    if (workflows.length > 0) {
      workflows.forEach(w => {
        console.log(`   - ID: ${w._id}, Status: ${w.overallStatus}, Created: ${w.createdAt}`);
      });
      
      const workflowDeleteResult = await ClearanceWorkflow.deleteMany({ sapid: invalidSapid });
      console.log(`   ✅ Deleted ${workflowDeleteResult.deletedCount} workflows\n`);
    } else {
      console.log(`   ℹ️ No workflows found\n`);
    }

    // Find and delete from ComprehensiveClearanceValidation
    console.log(`📋 Checking ComprehensiveClearanceValidation collection for SAPID ${invalidSapid}...`);
    const validations = await ComprehensiveClearanceValidation.find({ sapid: invalidSapid });
    console.log(`   Found: ${validations.length} validation record(s)`);
    
    if (validations.length > 0) {
      validations.forEach(v => {
        console.log(`   - ID: ${v._id}, Status: ${v.overallStatus}, Created: ${v.createdAt}`);
        console.log(`     Certificate Generated: ${v.certificateGenerated}`);
      });
      
      const validationDeleteResult = await ComprehensiveClearanceValidation.deleteMany({ sapid: invalidSapid });
      console.log(`   ✅ Deleted ${validationDeleteResult.deletedCount} validation records\n`);
    } else {
      console.log(`   ℹ️ No validation records found\n`);
    }

    // Find and delete related messages
    console.log(`📋 Checking Message collection for SAPID ${invalidSapid}...`);
    const messages = await Message.find({ 
      $or: [
        { sender_sapid: invalidSapid },
        { recipient_sapid: invalidSapid }
      ]
    });
    console.log(`   Found: ${messages.length} message(s)`);
    
    if (messages.length > 0) {
      const messageDeleteResult = await Message.deleteMany({
        $or: [
          { sender_sapid: invalidSapid },
          { recipient_sapid: invalidSapid }
        ]
      });
      console.log(`   ✅ Deleted ${messageDeleteResult.deletedCount} messages\n`);
    } else {
      console.log(`   ℹ️ No messages found\n`);
    }

    // Verify deletion
    console.log("✅ Verification After Deletion:");
    console.log("─".repeat(70));
    
    const remainingWorkflows = await ClearanceWorkflow.countDocuments({ sapid: invalidSapid });
    const remainingValidations = await ComprehensiveClearanceValidation.countDocuments({ sapid: invalidSapid });
    const remainingMessages = await Message.countDocuments({
      $or: [
        { sender_sapid: invalidSapid },
        { recipient_sapid: invalidSapid }
      ]
    });

    console.log(`   ClearanceWorkflow records: ${remainingWorkflows} (should be 0)`);
    console.log(`   ComprehensiveClearanceValidation records: ${remainingValidations} (should be 0)`);
    console.log(`   Message records: ${remainingMessages} (should be 0)`);

    if (remainingWorkflows === 0 && remainingValidations === 0 && remainingMessages === 0) {
      console.log(`\n✅ All records for SAPID ${invalidSapid} have been successfully removed!\n`);
    } else {
      console.log(`\n⚠️ Warning: Some records still exist for SAPID ${invalidSapid}\n`);
    }

    console.log("🎉 Cleanup completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

removeInvalidApprovedSapid();
