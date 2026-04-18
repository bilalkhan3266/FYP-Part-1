const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/role_based_system";

const ClearanceWorkflowSchema = new mongoose.Schema({
  studentName: String,
  sapid: String,
  registrationNo: String,
  fatherName: String,
  program: String,
  semester: String,
  degreeStatus: String,
  department: String,
  overallStatus: String,
  currentPhase: Number,
  phases: [{
    status: String,
    remarks: String,
    approverName: String,
    approvedAt: Date
  }],
  submittedAt: Date,
  updatedAt: Date
}, { collection: 'clearanceworkflows' });

const ClearanceWorkflow = mongoose.model('ClearanceWorkflow', ClearanceWorkflowSchema);

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Create 5 sample records with different statuses
    const sampleRecords = [
      {
        studentName: "Ali Ahmed",
        sapid: "FA20-BBA-001",
        registrationNo: "2020-001",
        fatherName: "Ahmed Khan",
        program: "BBA",
        semester: "8",
        degreeStatus: "Final",
        department: "Fee Department",
        overallStatus: "Completed",
        currentPhase: 5,
        phases: [
          { status: "Approved", remarks: "Cleared by Admin", approverName: "Admin User", approvedAt: new Date() },
          { status: "Approved", remarks: "No issues", approverName: "Fee Officer", approvedAt: new Date() },
          { status: "Approved", remarks: "Library cleared", approverName: "Librarian", approvedAt: new Date() },
          { status: "Approved", remarks: "Fee paid", approverName: "Fee Manager", approvedAt: new Date() },
          { status: "Completed", remarks: "All clear", approverName: "Coordinator", approvedAt: new Date() }
        ],
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        studentName: "Fatima Khan",
        sapid: "FA20-BBA-002",
        registrationNo: "2020-002",
        fatherName: "Khan Muhammad",
        program: "BBA",
        semester: "8",
        degreeStatus: "Final",
        department: "Fee Department",
        overallStatus: "Completed",
        currentPhase: 5,
        phases: [
          { status: "Approved", remarks: "OK", approverName: "Admin", approvedAt: new Date() },
          { status: "Approved", remarks: "Verified", approverName: "Fee Officer", approvedAt: new Date() },
          { status: "Approved", remarks: "Books returned", approverName: "Librarian", approvedAt: new Date() },
          { status: "Approved", remarks: "All fees paid", approverName: "Fee Manager", approvedAt: new Date() },
          { status: "Completed", remarks: "Final approval", approverName: "Coordinator", approvedAt: new Date() }
        ],
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        studentName: "Hassan Raza",
        sapid: "FA21-BSSE-050",
        registrationNo: "2021-050",
        fatherName: "Raza Ahmad",
        program: "BSSE",
        semester: "8",
        degreeStatus: "Final",
        department: "Fee Department",
        overallStatus: "Completed",
        currentPhase: 5,
        phases: [
          { status: "Approved", remarks: "Approved", approverName: "Admin", approvedAt: new Date() },
          { status: "Approved", remarks: "Fee verified", approverName: "Fee Officer", approvedAt: new Date() },
          { status: "Approved", remarks: "No holds", approverName: "Librarian", approvedAt: new Date() },
          { status: "Approved", remarks: "Payment done", approverName: "Fee Manager", approvedAt: new Date() },
          { status: "Completed", remarks: "Ready for graduation", approverName: "Coordinator", approvedAt: new Date() }
        ],
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        studentName: "Bilal Khan",
        sapid: "FA20-BCE-077",
        registrationNo: "2020-077",
        fatherName: "Khan Sahab",
        program: "BCE",
        semester: "8",
        degreeStatus: "Final",
        department: "Fee Department",
        overallStatus: "In Progress",
        currentPhase: 3,
        phases: [
          { status: "Approved", remarks: "Cleared", approverName: "Admin", approvedAt: new Date() },
          { status: "Approved", remarks: "OK", approverName: "Fee Officer", approvedAt: new Date() },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null }
        ],
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        studentName: "Ayesha Ahmed",
        sapid: "FA21-BBA-120",
        registrationNo: "2021-120",
        fatherName: "Ahmed Hassan",
        program: "BBA",
        semester: "6",
        degreeStatus: "Regular",
        department: "Fee Department",
        overallStatus: "Rejected",
        currentPhase: 2,
        phases: [
          { status: "Approved", remarks: "OK", approverName: "Admin", approvedAt: new Date() },
          { status: "Rejected", remarks: "Outstanding fees", approverName: "Fee Officer", approvedAt: new Date() },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null },
          { status: "Pending", remarks: "", approverName: "", approvedAt: null }
        ],
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    // Clear existing data
    await ClearanceWorkflow.deleteMany({});
    console.log("🗑️  Cleared existing data\n");

    // Insert sample data
    const result = await ClearanceWorkflow.insertMany(sampleRecords);
    console.log(`✅ Inserted ${result.length} sample records\n`);

    // Show statistics
    const total = await ClearanceWorkflow.countDocuments();
    const completed = await ClearanceWorkflow.countDocuments({ overallStatus: "Completed" });
    const inProgress = await ClearanceWorkflow.countDocuments({ overallStatus: "In Progress" });
    const rejected = await ClearanceWorkflow.countDocuments({ overallStatus: "Rejected" });

    console.log("📊 Database Statistics:");
    console.log(`  Total records: ${total}`);
    console.log(`  ✅ Completed: ${completed}`);
    console.log(`  🔄 In Progress: ${inProgress}`);
    console.log(`  ❌ Rejected: ${rejected}`);

    // Test phase 3 (Fee Department) approved count
    const approvedPhase3 = await ClearanceWorkflow.countDocuments({
      "phases.3.status": "Approved"
    });
    console.log(`\n  ✅ Approved in Fee Department (Phase 3): ${approvedPhase3}`);

    await mongoose.connection.close();
    console.log("\n✅ Done! Database seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedData();
