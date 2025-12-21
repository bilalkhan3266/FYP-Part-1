// Debug script to check Fee Department messages
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/role_based_system';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Define User schema
    const userSchema = new mongoose.Schema({}, { collection: 'users' });
    const User = mongoose.model('User', userSchema);

    // Define Message schema
    const messageSchema = new mongoose.Schema({}, { collection: 'messages' });
    const Message = mongoose.model('Message', messageSchema);

    // Find Fee Department user
    console.log('🔍 Finding Fee Department user...\n');
    const feeUser = await User.findOne({ role: /feedepartment/i });
    
    if (feeUser) {
      console.log('✅ Found Fee Department User:');
      console.log('  - Name:', feeUser.full_name);
      console.log('  - Role:', feeUser.role);
      console.log('  - Department:', feeUser.department);
      console.log('  - Email:', feeUser.email);
      console.log('  - SAP:', feeUser.sap);
      console.log('');
    } else {
      console.log('❌ No Fee Department user found\n');
    }

    // Find all messages sent to "Fee Department"
    console.log('🔍 Finding messages sent to "Fee Department"...\n');
    const messagesToFee = await Message.find({ 
      recipient_department: /fee/i,
      sender_role: 'student'
    }).lean();
    
    console.log(`Found ${messagesToFee.length} messages to Fee Department:`);
    messagesToFee.forEach(msg => {
      console.log(`  - From: ${msg.sender_name} (${msg.sender_sapid})`);
      console.log(`    To Dept: ${msg.recipient_department}`);
      console.log(`    Subject: ${msg.subject}`);
      console.log(`    Created: ${new Date(msg.createdAt).toLocaleString()}`);
      console.log('');
    });

    // Find all messages where recipient_department contains variations
    console.log('🔍 Finding ALL messages with recipient_department values:\n');
    const allMessages = await Message.find().select('sender_role sender_name recipient_department').lean();
    const deptCounts = {};
    allMessages.forEach(msg => {
      deptCounts[msg.recipient_department] = (deptCounts[msg.recipient_department] || 0) + 1;
    });
    
    console.log('Department names in database:');
    Object.entries(deptCounts).forEach(([dept, count]) => {
      console.log(`  - "${dept}": ${count} messages`);
    });

    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
