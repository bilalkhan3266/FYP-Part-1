const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ClearanceWorkflow = require('./models/ClearanceWorkflow');

(async () => {
  try {
    console.log('\n🔍 CLEARING DATABASE\n');
    
    // Get count before
    const beforeCount = await ClearanceWorkflow.countDocuments();
    console.log(`Before: ${beforeCount} total workflows`);
    
    // Delete all workflows
    const result = await ClearanceWorkflow.deleteMany({});
    console.log(`Deleted: ${result.deletedCount} workflows`);
    
    // Verify
    const afterCount = await ClearanceWorkflow.countDocuments();
    console.log(`After: ${afterCount} total workflows`);
    
    console.log('\n✅ Database cleared successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
