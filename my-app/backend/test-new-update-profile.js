const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testNewUpdateProfile() {
  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Login to get token...');
    const loginRes = await axios.post(`${API_URL}/api/login`, {
      email: 'transport@university.com',
      password: 'Transport@123'
    });

    if (!loginRes.data.success) {
      console.log('❌ Login failed:', loginRes.data.message);
      return;
    }

    const token = loginRes.data.token;
    const user = loginRes.data.user;

    console.log('✅ Login successful');
    console.log('   User:', user.full_name, `(${user.email})`);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 30) + '...');

    // Step 2: Update profile with NEW endpoint
    console.log('\n📝 Step 2: Update profile with NEW endpoint (/api/users/update-profile)...');
    const updateRes = await axios.put(
      `${API_URL}/api/users/update-profile`,
      {
        full_name: 'Updated Transport Staff',
        email: 'transport-updated@university.com',
        phone: '03001234567',
        address: 'Test Address',
        city: 'Islamabad',
        department: 'Transport',
        designation: 'Transport Manager'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response Status:', updateRes.status);
    console.log('Response Data:', JSON.stringify(updateRes.data, null, 2));

    if (!updateRes.data.success) {
      console.log('❌ Update failed:', updateRes.data.message);
      return;
    }

    console.log('✅ Profile updated successfully');
    console.log('   New Name:', updateRes.data.data.full_name);
    console.log('   New Email:', updateRes.data.data.email);
    console.log('   Phone:', updateRes.data.data.phone);
    console.log('   Address:', updateRes.data.data.address);

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test error:');
    console.error('   Status:', err.response?.status);
    console.error('   Data:', err.response?.data);
    console.error('   Message:', err.message);
  }
}

testNewUpdateProfile();
