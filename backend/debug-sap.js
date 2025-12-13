const mongoose = require("mongoose");
const User = require("./models/User");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

async function debugSapId() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Search for SAP ID 8877
    const sapId = "8877";
    console.log(`\n🔎 Searching for SAP ID: ${sapId}\n`);

    // Try all possible field names
    const queries = [
      { sapid: sapId },
      { sap_id: sapId },
      { sap: sapId }
    ];

    for (const query of queries) {
      const users = await User.find(query);
      const fieldName = Object.keys(query)[0];
      console.log(`📌 Field: "${fieldName}"`);
      console.log(`   Found: ${users.length} user(s)`);
      
      if (users.length > 0) {
        users.forEach(u => {
          console.log(`   - ${u.full_name} (role: "${u.role}", email: ${u.email})`);
          console.log(`     All SAP fields: sapid="${u.sapid}", sap_id="${u.sap_id}", sap="${u.sap}"`);
        });
      }
      console.log();
    }

    // Also search all users to see what SAP IDs exist
    console.log(`\n📊 All users in database:\n`);
    const allUsers = await User.find({});
    console.log(`Total users: ${allUsers.length}\n`);
    
    allUsers.forEach(u => {
      console.log(`- ${u.full_name}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  SAP IDs: sapid="${u.sapid}", sap_id="${u.sap_id}", sap="${u.sap}"`);
      console.log();
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  }
}

debugSapId();
