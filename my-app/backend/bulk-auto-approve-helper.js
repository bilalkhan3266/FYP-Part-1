const axios = require("axios");

const API_URL = "http://localhost:5000";

async function bulkAutoApprove() {
  try {
    console.log("\n============================================");
    console.log("🤖 BULK AUTO-APPROVAL TOOL");
    console.log("============================================\n");

    // Get a valid token first
    console.log("⚠️  This script needs to authenticate first");
    console.log("\nTo use this bulk auto-approval:\n");
    
    console.log("OPTION 1: Via Terminal (Quick)");
    console.log("-".repeat(50));
    console.log("Once backend is running, run in another terminal:");
    console.log(`
curl -X POST http://localhost:5000/api/clearance/bulk-auto-approve \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"
    `.trim());

    console.log("\n\nOPTION 2: Via Browser Console (Easiest)");
    console.log("-".repeat(50));
    console.log(`
1. Start backend: cd backend && npm start
2. Start frontend: cd frontend && npm start
3. Open http://localhost:3000
4. Login with any account
5. Press F12 -> Console
6. Run this JavaScript:

fetch('/api/clearance/bulk-auto-approve', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Result:', data))
.catch(e => console.error('❌ Error:', e));
    `.trim());

    console.log("\n\n✨ Expected Result:");
    console.log("-".repeat(50));
    console.log(`
{
  "success": true,
  "message": "Auto-approved 61/61 workflows",
  "approved": 61,
  "failed": 0,
  "results": [
    {
      "sapid": "443545",
      "studentName": "Muhammad Bilal",
      "status": "✅ Approved"
    },
    ...
  ]
}
    `.trim());

    console.log("\n============================================\n");

  } catch (err) {
    console.error("Error:", err.message);
  }
}

bulkAutoApprove();
