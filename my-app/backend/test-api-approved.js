const axios = require("axios");

const API_URL = "http://localhost:5000";
const JWT_TOKEN = "your_jwt_token_here"; // You'll need a valid token

async function testApprovedRecords() {
  try {
    console.log("🔍 Testing API endpoint: GET /api/clearance/department\n");

    // Test without token first (to see the error)
    try {
      const response = await axios.get(`${API_URL}/api/clearance/department`);
      console.log("❌ Should require token but didn't!");
    } catch (err) {
      console.log("✅ Token validation working (expected error)");
    }

    // You need to provide your JWT token
    console.log(`\n📝 To test with valid data, use a JWT token for a department staff member`);
    console.log(`   Example: Get token by logging in as library@example.com\n`);

    console.log("💡 Once you have a token, modify JWT_TOKEN at the top of this script and run again\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testApprovedRecords();
