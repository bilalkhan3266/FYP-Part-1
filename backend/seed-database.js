const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/library_management";

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // Delete existing users
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users\n");

    // Create test users
    const testUsers = [
      {
        full_name: "Ahmed Student",
        email: "student@example.com",
        password: "password123",
        role: "student",
        sap: "8877",
        department: "Computer Science"
      },
      {
        full_name: "Fatima Student",
        email: "fatima@example.com",
        password: "password123",
        role: "student",
        sap: "8878",
        department: "Computer Science"
      },
      {
        full_name: "Library Staff",
        email: "library@example.com",
        password: "password123",
        role: "library",
        sap: "LIB001",
        department: "Library"
      },
      {
        full_name: "Transport Staff",
        email: "transport@example.com",
        password: "password123",
        role: "transport",
        sap: "TRN001",
        department: "Transport"
      },
      {
        full_name: "Fee Staff",
        email: "fee@example.com",
        password: "password123",
        role: "fee",
        sap: "FEE001",
        department: "Fee"
      },
      {
        full_name: "HOD User",
        email: "hod@example.com",
        password: "password123",
        role: "Hod",
        sap: "HOD001",
        department: "Computer Science"
      },
      {
        full_name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        sap: "ADM001",
        department: "Admin"
      }
    ];

    // Hash passwords and create users
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      console.log(`✅ Created: ${user.full_name} (${user.role}) - SAP: ${user.sap}`);
    }

    console.log(`\n✅ Database seeded successfully! ${testUsers.length} users created.\n`);
    console.log("Test Credentials:");
    console.log("─────────────────────────────────────");
    console.log("Student 1:");
    console.log("  Email: student@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: 8877");
    console.log();
    console.log("Library Staff:");
    console.log("  Email: library@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: LIB001");
    console.log();
    console.log("Transport Staff:");
    console.log("  Email: transport@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: TRN001");
    console.log();
    console.log("Fee Staff:");
    console.log("  Email: fee@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: FEE001");
    console.log();
    console.log("HOD:");
    console.log("  Email: hod@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: HOD001");
    console.log();
    console.log("Admin:");
    console.log("  Email: admin@example.com");
    console.log("  Password: password123");
    console.log("  SAP ID: ADM001");
    console.log("─────────────────────────────────────\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  }
}

seedDatabase();
