const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_123456';

async function test() {
  try {
    // Connect to DB
    await mongoose.connect('mongodb://localhost:27017/role_based_system');
    console.log('✅ Connected to MongoDB\n');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    console.log('✅ Found admin:', admin.full_name);

    // Create token
    const token = jwt.sign({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      full_name: admin.full_name,
      sap: admin.sap
    }, JWT_SECRET);

    console.log('✅ Created token\n');

    // Test 1: Send to Library
    console.log('📤 TEST 1: Sending message to Library department...');
    try {
      const res = await axios.post('http://localhost:5000/api/admin/send-message', {
        messageType: 'department',
        targetType: 'specific',
        department: 'Library',
        subject: 'Test Message ' + Date.now(),
        message: 'This is a test message',
        priority: 'normal'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('   Status:', res.data.success);
      console.log('   Message:', res.data.message);
      console.log('   Recipients:', res.data.data?.recipientCount);
      console.log('   ✅ PASSED\n');
    } catch (err) {
      console.log('   ❌ FAILED:', err.response?.data?.message || err.message, '\n');
    }

    // Test 2: Get stats
    console.log('📊 TEST 2: Getting department statistics...');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/department-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('   Overall Stats:', res.data.data.overall);
      console.log('   Departments:');
      res.data.data.departments.forEach(d => {
        console.log(`     - ${d.departmentName}: ${d.receivedMessages || 0} messages`);
      });
      console.log('   ✅ PASSED\n');
    } catch (err) {
      console.log('   ❌ FAILED:', err.message, '\n');
    }

    // Test 3: Get department messages
    console.log('📬 TEST 3: Retrieving Library department messages...');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/department-messages/Library', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('   Total messages:', res.data.pagination.totalMessages);
      if (res.data.data.length > 0) {
        console.log('   Sample:', res.data.data[0].subject);
      }
      console.log('   ✅ PASSED\n');
    } catch (err) {
      console.log('   ❌ FAILED:', err.response?.data?.message || err.message, '\n');
    }

    // Test 4: Check messages in DB
    console.log('🗄️  TEST 4: Checking messages in database...');
    const count = await Message.countDocuments();
    console.log('   Total messages:', count);
    const recent = await Message.find().sort({ createdAt: -1 }).limit(1).lean();
    if (recent.length > 0) {
      console.log('   Most recent:');
      console.log('     Subject:', recent[0].subject);
      console.log('     Recipient dept:', recent[0].recipient_department);
      console.log('   ✅ PASSED\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
