const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUpdateProfile() {
  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Login to get token...');
    const loginRes = await axios.post(`${API_URL}/api/login`, {
      email: 'fee@university.com',
      password: 'Fee@123'
    });

    if (!loginRes.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginRes.data.token;
    const user = loginRes.data.user;

    console.log('✅ Login successful');
    console.log('   User:', user.full_name, `(${user.email})`);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Update profile
    console.log('\n📝 Step 2: Update profile...');
    const updateRes = await axios.put(
      `${API_URL}/api/update-profile`,
      {
        full_name: 'Updated Fee Staff',
        email: 'fee-updated@university.com'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!updateRes.data.success) {
      console.log('❌ Update failed:', updateRes.data.message);
      return;
    }

    console.log('✅ Profile updated successfully');
    console.log('   New Name:', updateRes.data.user.full_name);
    console.log('   New Email:', updateRes.data.user.email);

    // Step 3: Login again with new email to verify
    console.log('\n📝 Step 3: Login with new email to verify...');
    const verifyRes = await axios.post(`${API_URL}/api/login`, {
      email: 'fee-updated@university.com',
      password: 'Fee@123'
    });

    if (!verifyRes.data.success) {
      console.log('❌ Verification login failed');
      return;
    }

    console.log('✅ Verification successful');
    console.log('   User:', verifyRes.data.user.full_name);
    console.log('   Email:', verifyRes.data.user.email);

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test error:', err.response?.data || err.message);
  }
}

testUpdateProfile();
