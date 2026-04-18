const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ClearanceWorkflow = require("./models/ClearanceWorkflow");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/role_based_system";

const PHASE_ORDER = [
  "Coordination",
  "Library",
  "Transport",
  "Fee Department",
  "Student Service",
];

async function seedClearanceWorkflows() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // ============================================
    // 1. CREATE TEST USERS
    // ============================================
    console.log("📝 Creating/updating test users...\n");

    const testUsers = [
      {
        full_name: "Test Student",
        email: "teststudent@example.com",
        password: "password123",
        role: "student",
        sap: "12345",
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
        role: "feedepartment",
        sap: "FEE001",
        department: "Fee Department"
      },
      {
        full_name: "Student Service Staff",
        email: "studentservice@example.com",
        password: "password123",
        role: "studentservice",
        sap: "STS001",
        department: "Student Service"
      },
      {
        full_name: "Coordination Staff",
        email: "coordination@example.com",
        password: "password123",
        role: "coordination",
        sap: "COORD001",
        department: "Coordination"
      }
    ];

    let studentUser, libraryUser;
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        await user.save();
        console.log(`✅ Created: ${user.full_name} (${user.role}) - SAP: ${user.sap}`);
        
        if (userData.role === "student") studentUser = user;
        if (userData.role === "library") libraryUser = user;
      } else {
        console.log(`⏭️  User exists: ${existingUser.full_name} (${existingUser.role})`);
        
        if (userData.role === "student") studentUser = existingUser;
        if (userData.role === "library") libraryUser = existingUser;
      }
    }

    // Get coordination user for approvals
    const coordinationUser = await User.findOne({ email: "coordination@example.com" });

    console.log("\n");

    // ============================================
    // 2. CREATE CLEARANCE WORKFLOWS
    // ============================================
    console.log("🚀 Creating test ClearanceWorkflow documents...\n");

    // Clear existing workflows for this student (optional, for testing)
    // await ClearanceWorkflow.deleteMany({ studentId: studentUser._id });

    // Create workflows with different statuses
    const workflows = [
      {
        studentId: studentUser._id,
        sapid: studentUser.sap,
        studentName: studentUser.full_name,
        registrationNo: "REG-12345",
        fatherName: "Father Name",
        program: "BS Computer Science",
        semester: "8",
        degreeStatus: "Final Year",
        department: "Computer Science",
        overallStatus: "In Progress",
        currentPhase: 1, // Library phase (index 1)
        phases: [
          {
            name: "Coordination",
            status: "Approved",
            approvedBy: coordinationUser ? coordinationUser._id : null,
            approverName: coordinationUser ? coordinationUser.full_name : "Coordination Staff",
            remarks: "Initial coordination complete",
            approvedAt: new Date(Date.now() - 3*24*60*60*1000),
          },
          {
            name: "Library",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Transport",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Fee Department",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Student Service",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
        ],
        submittedAt: new Date(Date.now() - 5*24*60*60*1000),
        completedAt: null,
      },
      {
        studentId: studentUser._id,
        sapid: "54321",
        studentName: "Another Student",
        registrationNo: "REG-54321",
        fatherName: "Father Name 2",
        program: "BS Business Administration",
        semester: "6",
        degreeStatus: "Regular",
        department: "Business",
        overallStatus: "In Progress",
        currentPhase: 1, // Library phase (index 1)
        phases: [
          {
            name: "Coordination",
            status: "Approved",
            approvedBy: coordinationUser ? coordinationUser._id : null,
            approverName: coordinationUser ? coordinationUser.full_name : "Coordination Staff",
            remarks: "Approved",
            approvedAt: new Date(Date.now() - 2*24*60*60*1000),
          },
          {
            name: "Library",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Transport",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Fee Department",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
          {
            name: "Student Service",
            status: "Pending",
            approvedBy: null,
            approverName: "",
            remarks: "",
            approvedAt: null,
          },
        ],
        submittedAt: new Date(Date.now() - 1*24*60*60*1000),
        completedAt: null,
      },
    ];

    for (const workflowData of workflows) {
      const workflow = new ClearanceWorkflow(workflowData);
      await workflow.save();
      console.log(`✅ Created workflow for ${workflow.sapid} - Status: ${workflow.overallStatus}, Current Phase: ${PHASE_ORDER[workflow.currentPhase]} (Index: ${workflow.currentPhase})`);
      console.log(`   Workflow ID: ${workflow._id}\n`);
    }

    console.log("✨ Seeding complete!\n");
    console.log("📋 Test Credentials:\n");
    console.log("   Student:");
    console.log("   - Email: teststudent@example.com");
    console.log("   - Password: password123\n");
    console.log("   Library Staff:");
    console.log("   - Email: library@example.com");
    console.log("   - Password: password123\n");
    console.log("💡 Next steps:");
    console.log("   1. Login as library@example.com");
    console.log("   2. Go to Library Dashboard");
    console.log("   3. Try to approve/reject a request\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
}

seedClearanceWorkflows();
