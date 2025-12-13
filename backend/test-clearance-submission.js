// backend/test-clearance-submission.js
// Quick test script to verify clearance request functionality

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const ClearanceRequest = require("./models/ClearanceRequest");
const DepartmentClearance = require("./models/DepartmentClearance");

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

async function testClearanceSubmission() {
  try {
    console.log('\n🔍 Testing Clearance Request Submission...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find a student user
    console.log('🔎 Finding student user...');
    const student = await User.findOne({ 
      $expr: { $eq: [{ $toLower: "$role" }, "student"] }
    });
    
    if (!student) {
      console.log('❌ No student found in database');
      console.log('   Please create a student user first\n');
      process.exit(1);
    }
    
    console.log(`✅ Found student: ${student.full_name} (${student.sap})\n`);

    // Check if student has required fields
    console.log('📋 Checking student fields:');
    console.log(`   - Full Name: ${student.full_name ? '✅' : '❌'}`);
    console.log(`   - SAP ID: ${student.sap ? '✅' : '❌'}`);
    console.log(`   - Email: ${student.email ? '✅' : '❌'}`);
    console.log(`   - Department: ${student.department ? '✅' : '❌'}\n`);

    if (!student.sap || !student.full_name) {
      console.log('❌ Student missing required fields (SAP ID or Full Name)\n');
      process.exit(1);
    }

    // Create a test clearance request
    console.log('📝 Creating test clearance request...\n');
    
    const testRequest = new ClearanceRequest({
      student_id: student._id,
      sapid: student.sap,
      student_name: student.full_name,
      registration_no: "22-CS-TEST-001",
      father_name: "Test Father",
      program: "BSCS",
      semester: "8",
      degree_status: "Final Year",
      department: student.department || "Engineering",
      status: "Pending"
    });

    const savedRequest = await testRequest.save();
    console.log(`✅ Clearance Request created: ${savedRequest._id}\n`);

    // Create department clearances
    console.log('📋 Creating department clearance records...\n');
    
    const departments = [
      'Library',
      'Transport',
      'Laboratory',
      'Student Service',
      'Fee Department',
      'Coordination',
      'HOD'
    ];

    const departmentRecords = departments.map(dept => ({
      clearance_request_id: savedRequest._id,
      student_id: student._id,
      sapid: student.sap,
      student_name: student.full_name,
      registration_no: "22-CS-TEST-001",
      father_name: "Test Father",
      program: "BSCS",
      semester: "8",
      degree_status: "Final Year",
      department_name: dept,
      status: "Pending"
    }));

    const savedDepts = await DepartmentClearance.insertMany(departmentRecords);
    console.log(`✅ Created ${savedDepts.length} department records\n`);

    // Verify records
    console.log('🔍 Verifying saved records...\n');
    
    const mainRecord = await ClearanceRequest.findById(savedRequest._id);
    console.log('Main ClearanceRequest:');
    console.log(`  - ID: ${mainRecord._id}`);
    console.log(`  - Student: ${mainRecord.student_name} (${mainRecord.sapid})`);
    console.log(`  - Status: ${mainRecord.status}`);
    console.log(`  - Created: ${mainRecord.createdAt}\n`);

    const deptRecords = await DepartmentClearance.find({ clearance_request_id: savedRequest._id });
    console.log(`DepartmentClearance Records: ${deptRecords.length}`);
    deptRecords.forEach(record => {
      console.log(`  ✅ ${record.department_name}: ${record.status}`);
    });

    console.log('\n✅ Test completed successfully!\n');
    console.log('🎉 Clearance request submission is working correctly!\n');

  } catch (err) {
    console.error('\n❌ Test failed with error:');
    console.error(err.message);
    console.error('\nDetails:', {
      name: err.name,
      code: err.code,
      message: err.message
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed\n');
  }
}

testClearanceSubmission();
