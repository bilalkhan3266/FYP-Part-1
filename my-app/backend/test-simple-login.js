const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function test() {
  try {
    console.log('🔐 Attempting login...');
    const res = await axios.post(`${API_URL}/api/login`, {
      email: 'fee@university.com',
      password: 'Fee@123'
    });
    console.log('✅ Login Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Response:', err.response?.data);
  }
}

test();
