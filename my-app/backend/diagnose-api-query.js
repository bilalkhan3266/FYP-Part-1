const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ClearanceWorkflow = require('./models/ClearanceWorkflow');

const PHASE_ORDER = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

(async () => {
  try {
    console.log('\n🔍 SIMULATING API QUERY FOR LIBRARY DEPARTMENT\n');
    
    const phaseIndex = 1; // Library is phase 1
    const phaseName = PHASE_ORDER[phaseIndex];
    
    console.log(`Phase: ${phaseName} (index ${phaseIndex})\n`);
    
    // Query 1: Pending (current phase)
    const pending = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      currentPhase: phaseIndex,
    });
    
    console.log(`Pending (currentPhase: ${phaseIndex}): ${pending.length}`);
    pending.forEach(p => console.log(`  • SAP: ${p.sapid}, Phase: ${p.currentPhase}`));
    
    // Query 2: Rejected
    const rejected = await ClearanceWorkflow.find({
      overallStatus: "Rejected",
      [`phases.${phaseIndex}.status`]: "Rejected",
    });
    
    console.log(`\nRejected: ${rejected.length}`);
    rejected.forEach(r => console.log(`  • SAP: ${r.sapid}`));
    
    // Query 3: Approved (all completed)
    const approvedCompleted = await ClearanceWorkflow.find({
      overallStatus: "Completed",
    });
    
    console.log(`\nApproved (completed): ${approvedCompleted.length}`);
    approvedCompleted.forEach(a => console.log(`  • SAP: ${a.sapid}, _id: ${a._id}`));
    
    // Query 4: Approved (this phase)
    const approvedThisPhase = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      [`phases.${phaseIndex}.status`]: "Approved",
    });
    
    console.log(`\nApproved (this phase): ${approvedThisPhase.length}`);
    approvedThisPhase.forEach(a => console.log(`  • SAP: ${a.sapid}`));
    
    console.log(`\n📊 SUMMARY`);
    console.log(`Pending: ${pending.length}`);
    console.log(`Approved: ${approvedCompleted.length + approvedThisPhase.length}`);
    console.log(`Rejected: ${rejected.length}`);
    
    if (pending.length > 0) {
      console.log(`\n✅ Sample pending record:`, {
        _id: pending[0]._id,
        sapid: pending[0].sapid,
        studentName: pending[0].studentName
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
