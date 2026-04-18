const axios = require("axios");

async function testAdminMessage() {
  try {
    // Create a proper JWT token for admin
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: "507f1f77bcf86cd799439011",
        sap: "ADM001",
        full_name: "Admin User",
        email: "admin@example.com",
        role: "admin"
      },
      "your_super_secret_jwt_key_change_in_production_123456"
    );

    console.log("📨 Testing admin send-message endpoint...\n");

    const payload = {
      messageType: "department",
      targetType: "specific",
      department: "Library",
      subject: "Test Admin Message",
      message: "This is a test message from admin",
      priority: "normal"
    };

    console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "http://localhost:5000/api/admin/send-message",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        timeout: 5000
      }
    );

    console.log("\n✅ Response Status:", response.status);
    console.log("✅ Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("Request made but no response:", error.request);
    } else {
      console.error("Error details:", error);
    }
  }
}

testAdminMessage();
