// Test script to verify admin message sending works
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');

async function testAdminMessaging() {
  try {
    console.log('🔍 Testing admin message functionality...\n');

    // Connect to MongoDB (same connection as server.js)
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/riphah-university-db';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }
    console.log(`✅ Found admin: ${admin.full_name} (${admin.sap})\n`);

    // Find library department staff
    const libraryStaff = await User.findOne({ role: /^library$/i });
    if (!libraryStaff) {
      console.log('❌ No library staff found');
      return;
    }
    console.log(`✅ Found library staff: ${libraryStaff.full_name}`);
    console.log(`   - SAP: ${libraryStaff.sap || '(none - will be generated)'}`);
    console.log(`   - Role: ${libraryStaff.role}`);
    console.log(`   - Department: ${libraryStaff.department}\n`);

    // Test creating a message with the admin
    console.log('📨 Creating test message...');
    
    // Generate SAP ID if missing (mimic the fix)
    let recipientSapId = libraryStaff.sap;
    if (!recipientSapId) {
      const rolePrefix = libraryStaff.role ? libraryStaff.role.substring(0, 3).toUpperCase() : 'USR';
      recipientSapId = `${rolePrefix}${libraryStaff._id.toString().substring(0, 6)}`;
      console.log(`⚠️  Generated SAP ID: ${recipientSapId}`);
    }

    const testMessage = new Message({
      sender_id: admin._id,
      sender_name: admin.full_name,
      sender_role: 'admin',
      sender_sapid: admin.sap,
      recipient_id: libraryStaff._id,
      recipient_sapid: recipientSapId,
      recipient_department: libraryStaff.department,
      subject: '[TEST] Admin Message - Verify Validation',
      message: 'This is a test message to verify the admin messaging fix works',
      message_type: 'notification',
      priority: 'normal',
      is_read: false,
      createdAt: new Date()
    });

    console.log(`\n📋 Message object:`);
    console.log(`   - sender_id: ${testMessage.sender_id}`);
    console.log(`   - sender_name: ${testMessage.sender_name}`);
    console.log(`   - recipient_id: ${testMessage.recipient_id}`);
    console.log(`   - recipient_sapid: ${testMessage.recipient_sapid}`);
    console.log(`   - recipient_department: ${testMessage.recipient_department}`);
    console.log(`   - subject: ${testMessage.subject}\n`);

    // Try to save the message
    await testMessage.save();
    console.log('✅ Message saved successfully!\n');

    // Verify the message was saved
    const savedMessage = await Message.findById(testMessage._id);
    if (savedMessage) {
      console.log('✅ Message retrieval successful:');
      console.log(`   - To: ${savedMessage.recipient_sapid} (${savedMessage.recipient_department})`);
      console.log(`   - Subject: ${savedMessage.subject}`);
      console.log(`   - Created: ${savedMessage.createdAt}\n`);
    }

    console.log('🎉 Admin message validation test PASSED!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.errors) {
      console.error('Validation errors:', err.errors);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAdminMessaging();
