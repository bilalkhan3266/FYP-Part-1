// backend/test-api.js
// Quick API test script

require("dotenv").config();
const axios = require("axios");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default_key";

async function testAPI() {
  try {
    // Create a test token
    const token = jwt.sign(
      {
        id: "6939140bac73b144bf23a790",
        email: "test@test.com",
        full_name: "Test User",
        role: "student",
        sap: "10001"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("🔐 Testing Clearance Request API...\n");
    console.log("Token:", token.substring(0, 50) + "...\n");

    const response = await axios.post(
      "http://localhost:5000/api/clearance-requests",
      {
        sapid: "10001",
        student_name: "Test User",
        registration_no: "TEST-001",
        father_name: "Father Name",
        program: "BSCS",
        semester: "8",
        degree_status: "Final Year",
        department: "Engineering"
      },
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ API Response Status:", response.status);
    console.log("✅ API Response Data:", response.data);

  } catch (err) {
    console.error("❌ API Error:");
    console.error("   Full Error:", err);
    if (err.response) {
      console.error("   Status:", err.response.status);
      console.error("   Data:", JSON.stringify(err.response.data));
    } else if (err.message) {
      console.error("   Message:", err.message);
    }
    if (err.code) {
      console.error("   Code:", err.code);
    }
  }
}

testAPI();
