#!/usr/bin/env node
/**
 * Comprehensive Admin Messaging Diagnostic
 * Tests each step to identify where the failure occurs
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_123456';

let adminToken = '';
let testAdmin = null;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
    return true;
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    return false;
  }
}

async function setupTestData() {
  try {
    const User = require('./models/User');
    
    testAdmin = await User.findOne({ role: 'admin' });
    if (testAdmin) {
      console.log('✅ Found admin:', testAdmin.full_name, '(', testAdmin.email, ')');
      console.log('   Admin ID:', testAdmin._id);
      console.log('   Admin Role:', testAdmin.role);
      return true;
    } else {
      console.log('❌ No admin user found in database');
      return false;
    }
  } catch (err) {
    console.error('❌ Error finding admin:', err.message);
    return false;
  }
}

async function createAdminToken() {
  try {
    adminToken = jwt.sign(
      {
        id: testAdmin._id,
        email: testAdmin.email,
        role: testAdmin.role,
        full_name: testAdmin.full_name,
        sap: testAdmin.sap
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('✅ Admin token created');
    console.log('   Token (first 50 chars):', adminToken.substring(0, 50) + '...');
    return true;
  } catch (err) {
    console.error('❌ Token creation error:', err.message);
    return false;
  }
}

async function testAPIConnection() {
  try {
    console.log('\n📡 Testing API Connection...');
    const response = await axios.get(`${API_URL}/api/admin/department-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      timeout: 5000
    });
    console.log('✅ API is accessible');
    console.log('   Response status:', response.status);
    return true;
  } catch (err) {
    console.error('❌ API Connection Error:', err.message);
    if (err.response?.status) {
      console.error('   HTTP Status:', err.response.status);
      console.error('   Response:', err.response.data);
    }
    return false;
  }
}

async function testSendMessage() {
  try {
    console.log('\n📤 Testing Send Message...');
    console.log('   Sending message to Library department...');
    
    const payload = {
      messageType: 'department',
      targetType: 'specific',
      department: 'Library',
      subject: 'DIAGNOSTIC TEST - ' + new Date().toISOString(),
      message: 'This is a diagnostic test message',
      priority: 'normal'
    };

    console.log('   Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${API_URL}/api/admin/send-message`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Message send response received');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Recipient Count:', response.data.data?.recipientCount);

    if (response.data.success) {
      return true;
    } else {
      console.log('❌ Message send failed - success flag is false');
      return false;
    }
  } catch (err) {
    console.error('❌ Send Message Error:', err.message);
    if (err.response?.status) {
      console.error('   HTTP Status:', err.response.status);
      console.error('   Response:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

async function checkMessagesInDB() {
  try {
    console.log('\n📊 Checking Messages in Database...');
    const Message = require('./models/Message');
    
    const count = await Message.countDocuments();
    console.log('   Total messages:', count);

    // Find recent messages
    const recent = await Message.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (recent.length > 0) {
      console.log('   Recent messages:');
      recent.forEach((msg, i) => {
        console.log(`     ${i+1}. Subject: "${msg.subject}"`);
        console.log(`        Type: ${msg.message_type}, Status: ${msg.status}, Read: ${msg.is_read}`);
        console.log(`        Fields: sender_id=${!!msg.sender_id}, recipient_id=${!!msg.recipient_id}, recipient_sapid=${!!msg.recipient_sapid}`);
      });
      return true;
    } else {
      console.log('   ❌ No messages found in database');
      return false;
    }
  } catch (err) {
    console.error('❌ Database check error:', err.message);
    return false;
  }
}

async function checkStats() {
  try {
    console.log('\n📊 Checking Department Statistics...');
    
    const response = await axios.get(
      `${API_URL}/api/admin/department-stats`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      }
    );

    if (response.data.success) {
      console.log('✅ Stats endpoint working');
      console.log('   Overall stats:', response.data.data.overall);
      
      const depts = response.data.data.departments;
      if (depts && depts.length > 0) {
        console.log('   Department stats:');
        depts.slice(0, 3).forEach(dept => {
          console.log(`     - ${dept.departmentName}: ${dept.receivedMessages || 0} messages`);
        });
        return true;
      } else {
        console.log('❌ No department data');
        return false;
      }
    } else {
      console.log('❌ Stats endpoint returned success: false');
      console.log('   Response:', response.data);
      return false;
    }
  } catch (err) {
    console.error('❌ Stats check error:', err.message);
    if (err.response?.data) {
      console.error('   Response:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

async function testDepartmentMessageRetrieval() {
  try {
    console.log('\n📬 Testing Department Message Retrieval...');
    
    const response = await axios.get(
      `${API_URL}/api/admin/department-messages/library`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      }
    );

    if (response.data.success) {
      console.log('✅ Department messages endpoint working');
      console.log('   Total messages:', response.data.pagination.totalMessages);
      if (response.data.data.length > 0) {
        console.log('   Sample message:', response.data.data[0].subject);
        return true;
      }
    } else {
      console.log('❌ Endpoint returned success: false');
      return false;
    }
  } catch (err) {
    console.error('❌ Department message retrieval error:', err.message);
    if (err.response?.status === 403) {
      console.log('   (Authorization issue - might be normal for non-library staff)');
    }
    return false;
  }
}

async function diagnoseServerLogs() {
  console.log('\n🔍 Checking Server Configuration...');
  try {
    const response = await axios.get(`${API_URL}/health || /`, {
      timeout: 5000
    });
    console.log('✅ Server is responding');
  } catch (err) {
    // This is expected - health endpoint might not exist
    console.log('⚠️  Server health check inconclusive (this is normal)');
  }
}

async function runDiagnostics() {
  console.log('='.repeat(60));
  console.log('🧪 ADMIN MESSAGING SYSTEM DIAGNOSTICS');
  console.log('='.repeat(60));

  const results = [];

  // Step 1: Database
  console.log('\n1️⃣  DATABASE CONNECTION');
  results.push(await connectDB());

  // Step 2: Test Data
  console.log('\n2️⃣  TEST DATA');
  results.push(await setupTestData());

  // Step 3: Token
  console.log('\n3️⃣  AUTHENTICATION');
  results.push(await createAdminToken());

  // Step 4: API Connection
  console.log('\n4️⃣  API CONNECTION');
  results.push(await testAPIConnection());

  // Step 5: Send Message
  console.log('\n5️⃣  MESSAGE SENDING');
  results.push(await testSendMessage());

  // Step 6: Check DB
  console.log('\n6️⃣  DATABASE VERIFICATION');
  results.push(await checkMessagesInDB());

  // Step 7: Check Stats
  console.log('\n7️⃣  STATISTICS ENDPOINT');
  results.push(await checkStats());

  // Step 8: Message Retrieval
  console.log('\n8️⃣  MESSAGE RETRIEVAL');
  results.push(await testDepartmentMessageRetrieval());

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
  } else {
    console.log(`⚠️  ${total - passed} issues detected`);
    console.log('\nFailing tests:');
    const testNames = [
      'Database Connection',
      'Test Data',
      'Authentication',
      'API Connection',
      'Message Sending',
      'Database Verification',
      'Statistics Endpoint',
      'Message Retrieval'
    ];
    results.forEach((r, i) => {
      if (!r) console.log(`  ❌ ${i + 1}. ${testNames[i]}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

// Run diagnostics
runDiagnostics()
  .catch(console.error)
  .finally(() => {
    mongoose.connection.close();
    process.exit(0);
  });
