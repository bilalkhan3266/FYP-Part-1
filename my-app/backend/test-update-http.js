const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({status: res.statusCode, data: JSON.parse(body)});
        } catch(e) {
          resolve({status: res.statusCode, data: body});
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    console.log('🔐 Testing login...');
    
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'fee@university.com', password: 'Fee@123' });

    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginRes.data, null, 2));

    if (!loginRes.data.success) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful');
    const token = loginRes.data.token;

    // Test update profile
    console.log('\n📝 Testing update profile...');
    const updateRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/update-profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    }, {
      full_name: 'Updated Fee Staff',
      email: 'fee-new@university.com'
    });

    console.log('Status:', updateRes.status);
    console.log('Response:', JSON.stringify(updateRes.data, null, 2));

  } catch(err) {
    console.error('❌ Test error:', err.message);
  }
}

test();
