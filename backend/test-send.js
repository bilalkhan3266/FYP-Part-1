const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_123456';

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/role_based_system');
    const admin = await User.findOne({ role: 'admin' });
    
    const token = jwt.sign({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      full_name: admin.full_name,
      sap: admin.sap
    }, JWT_SECRET);

    console.log('📤 Sending message to Library...\n');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/send-message', {
        messageType: 'department',
        targetType: 'specific',
        department: 'Library',
        subject: 'Test ' + Date.now(),
        message: 'Test message'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ SUCCESS');
      console.log('Status:', res.status);
      console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.log('❌ FAILED');
      if (err.response) {
        console.log('HTTP Status:', err.response.status);
        console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
        console.log('Error Headers:', JSON.stringify(err.response.headers, null, 2));
      } else if (err.request) {
        console.log('No response received');
        console.log('Request:', err.request);
      } else {
        console.log('Error message:', err.message);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup Error:', err.message);
    process.exit(1);
  }
}

test();
