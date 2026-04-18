const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ClearanceWorkflow = require('./models/ClearanceWorkflow');

(async () => {
  try {
    console.log('\n🔍 CHECKING DATABASE IDS\n');
    
    // First, check what statuses exist
    const allDocs = await ClearanceWorkflow.find({}).lean().limit(10);
    console.log(`Total workflows in DB: ${allDocs.length}\n`);
    
    if (allDocs.length > 0) {
      console.log('Sample records and their statuses:');
      allDocs.slice(0, 3).forEach((doc, i) => {
        console.log(`  ${i + 1}. SAP: ${doc.sapid}, Status: "${doc.overallStatus}", Phase: ${doc.currentPhase}`);
      });
      
      // Get unique statuses
      const statuses = [...new Set(allDocs.map(d => d.overallStatus))];
      console.log(`\nUnique statuses in DB: ${statuses.join(', ')}\n`);
    }
    
    // Now query for pending (In Progress with current phase index 0 for Library)
    const docs = await ClearanceWorkflow.find({ overallStatus: 'In Progress', currentPhase: 0 }).limit(3).lean();
    
    console.log(`\n📍 Found ${docs.length} pending workflows for Library (phase 0)\n`);
    
    if (docs.length > 0) {
      docs.forEach((doc, i) => {
        console.log(`Record ${i + 1}:`);
        console.log(`  _id (MongoDB): ${doc._id}`);
        console.log(`  _id type: ${typeof doc._id}`);
        console.log(`  SAP ID: ${doc.sapid}`);
        console.log(`  Student: ${doc.studentName}`);
        console.log('');
      });
    } else {
      // Try without phase filter
      const allPending = await ClearanceWorkflow.find({ overallStatus: 'In Progress' }).lean().limit(3);
      console.log(`Found ${allPending.length} with just "In Progress" status\n`);
      if (allPending.length > 0) {
        allPending.forEach((doc, i) => {
          console.log(`  ${i + 1}. SAP: ${doc.sapid}, Phase: ${doc.currentPhase}`);
        });
      }
    }
    
    // Now test what the API returns
    console.log('\n🔍 TESTING API RESPONSE FORMAT\n');
    
    const testDoc = docs[0];
    if (testDoc) {
      console.log('Raw database _id:', testDoc._id);
      console.log('Stringified:', testDoc._id.toString());
      console.log('In response, would be:', {
        _id: testDoc._id,
        sapid: testDoc.sapid,
        studentName: testDoc.studentName
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
