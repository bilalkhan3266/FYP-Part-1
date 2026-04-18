const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testWithActualUser() {
  try {
    // Try common credentials first
    const testCredentials = [
      { email: 'transport@university.com', password: 'Transport@123' },
      { email: 'transport@riphah.edu', password: 'Transport@123' },
      { email: 'staff@university.com', password: 'Staff@123' },
      { email: 'hod@university.com', password: 'HOD@123' },
    ];

    let token = null;
    let loggedInUser = null;

    for (const cred of testCredentials) {
      try {
        console.log(`📝 Trying login with ${cred.email}...`);
        const loginRes = await axios.post(`${API_URL}/api/login`, {
          email: cred.email,
          password: cred.password
        });

        if (loginRes.data.success) {
          token = loginRes.data.token;
          loggedInUser = loginRes.data.user;
          console.log('✅ Login successful with:', loggedInUser.full_name);
          break;
        }
      } catch (e) {
        // Try next credential
      }
    }

    if (!token) {
      console.log('❌ Could not login with any test credentials');
      return;
    }

    // Test the new update endpoint
    console.log('\n📝 Testing /api/users/update-profile...');
    console.log('   User ID from token:', loggedInUser.id);
    
    try {
      const updateRes = await axios.put(
        `${API_URL}/api/users/update-profile`,
        {
          full_name: 'Test User ' + Date.now(),
          email: loggedInUser.email,
          phone: '03001234567',
          address: 'Test Address',
          city: 'Islamabad'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Update successful!');
      console.log('   Response:', JSON.stringify(updateRes.data, null, 2));
    } catch (updateErr) {
      console.log('❌ Update failed!');
      console.log('   Status:', updateErr.response?.status);
      console.log('   Error:', updateErr.response?.data);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testWithActualUser();
