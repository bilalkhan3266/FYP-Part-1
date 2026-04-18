// Script to test if library messages exist in MongoDB
const mongoose = require('mongoose');
const Message = require('./models/Message');

mongoose.connect('mongodb://localhost:27017/role_based_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testData() {
  try {
    console.log('🔍 Testing library messages data...\n');

    // Count all messages
    const totalMessages = await Message.countDocuments();
    console.log(`📊 Total messages in DB: ${totalMessages}\n`);

    // Count library requests
    const libraryRequests = await Message.countDocuments({ message_type: 'library_request' });
    console.log(`📌 Library requests: ${libraryRequests}\n`);

    // Find all pending library requests
    const pendingRequests = await Message.find({ 
      message_type: 'library_request', 
      status: 'Pending' 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${pendingRequests.length} pending library requests:\n`);

    pendingRequests.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.studentName} (${msg.sapid})`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   Message: ${msg.message}`);
      console.log(`   Status: ${msg.status}`);
      console.log(`   Type: ${msg.message_type}`);
      console.log(`   Created: ${msg.createdAt}\n`);
    });

    // Test the exact query that the endpoint uses
    const testQuery = await Message.find({ 
      message_type: 'library_request', 
      status: 'Pending' 
    }).sort({ createdAt: -1 }).exec();

    console.log(`\n🎯 Direct endpoint query returned: ${testQuery.length} messages`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB\n');
  testData();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
