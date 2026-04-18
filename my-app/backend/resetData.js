const mongoose = require("mongoose");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";

async function createCleanData() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB\n");

    // Clear all old workflows
    const deleted = await ClearanceWorkflow.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} old corrupted workflows\n`);

    // Create several clean test workflows
    const testData = [
      {
        studentId: new mongoose.Types.ObjectId(),
        sapid: "12345",
        studentName: "Test Student",
        registrationNo: "12345",
        fatherName: "Test Father",
        email: "test@student.com",
        phone: "03001234567",
        program: "BS Software Engineering",
        semester: 8,
        degreeStatus: "Final",
        department: "Student",
        overallStatus: "In Progress",
        currentPhase: 1,
        phases: [
          { name: "Coordination", status: "Approved", approverName: "Auto-System", remarks: "Auto-approved", approvedAt: new Date() },
          { name: "Library", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Transport", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Fee Department", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Student Service", status: "Pending", approverName: null, remarks: "", approvedAt: null },
        ],
        createdAt: new Date(),
        submittedAt: new Date(),
      },
      {
        studentId: new mongoose.Types.ObjectId(),
        sapid: "54321",
        studentName: "Ahmed Hassan",
        registrationNo: "54321",
        fatherName: "Hassan Khan",
        email: "ahmed@student.com",
        phone: "03009876543",
        program: "BS Computer Science",
        semester: 6,
        degreeStatus: "Penultimate",
        department: "Student",
        overallStatus: "In Progress",
        currentPhase: 1,
        phases: [
          { name: "Coordination", status: "Approved", approverName: "Auto-System", remarks: "Auto-approved", approvedAt: new Date() },
          { name: "Library", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Transport", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Fee Department", status: "Pending", approverName: null, remarks: "", approvedAt: null },
          { name: "Student Service", status: "Pending", approverName: null, remarks: "", approvedAt: null },
        ],
        createdAt: new Date(),
        submittedAt: new Date(),
      },
    ];

    const inserted = await ClearanceWorkflow.insertMany(testData);
    console.log(`✅ Created ${inserted.length} clean test workflows\n`);

    inserted.forEach((w, i) => {
      console.log(`${i + 1}. SAP: ${w.sapid} | Name: ${w.studentName}`);
    });

    console.log("\n✅ Data reset complete!");
    console.log("\n📋 Test records created:");
    console.log("   • All have Coordination phase: APPROVED");
    console.log("   • All have Library phase: PENDING\n");

    console.log("⚠️  NEXT STEPS:");
    console.log("   1. Hard refresh browser (Ctrl+Shift+R)");
    console.log("   2. Clear browser cache/storage");
    console.log("   3. Login as Library staff");
    console.log("   4. Click Approved tab - should be EMPTY");
    console.log("   5. No more 'Unknown Student' records!\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createCleanData();
