const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');
const ClearanceWorkflow = require('./models/ClearanceWorkflow');

(async () => {
  try {
    console.log('\n🚀 CREATING TEST DATA\n');
    
    // Create test student
    let student = await User.findOne({ email: 'teststudent@example.com' });
    if (!student) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      student = new User({
        full_name: 'Test Student',
        email: 'teststudent@example.com',
        password: hashedPassword,
        role: 'student',
        sap: '999888',
        department: 'Computer Science'
      });
      await student.save();
      console.log('✅ Created student:', student.full_name);
    } else {
      console.log('⏭️  Student exists:', student.full_name);
    }
    
    // Create test library staff
    let libraryStaff = await User.findOne({ email: 'librarydebug@example.com' });
    if (!libraryStaff) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      libraryStaff = new User({
        full_name: 'Library Staff Debug',
        email: 'librarydebug@example.com',
        password: hashedPassword,
        role: 'library',
        sap: 'LIB999',
        department: 'Library'
      });
      await libraryStaff.save();
      console.log('✅ Created library staff:', libraryStaff.full_name);
    } else {
      console.log('⏭️  Library staff exists:', libraryStaff.full_name);
    }
    
    // Create one test workflow (pending at Library phase)
    const workflow = new ClearanceWorkflow({
      studentId: student._id,
      sapid: student.sap,
      studentName: student.full_name,
      registrationNo: 'REG-TEST-001',
      fatherName: 'Test Father',
      program: 'BS Computer Science',
      semester: '8',
      degreeStatus: 'Final Year',
      department: 'Computer Science',
      overallStatus: 'In Progress',
      currentPhase: 1, // Library phase
      phases: [
        {
          name: 'Coordination',
          status: 'Approved',
          approvedBy: null,
          approverName: 'System',
          remarks: 'Pre-approved',
          approvedAt: new Date(Date.now() - 24*60*60*1000),
        },
        {
          name: 'Library',
          status: 'Pending',
          approvedBy: null,
          approverName: '',
          remarks: '',
          approvedAt: null,
        },
        {
          name: 'Transport',
          status: 'Pending',
          approvedBy: null,
          approverName: '',
          remarks: '',
          approvedAt: null,
        },
        {
          name: 'Fee Department',
          status: 'Pending',
          approvedBy: null,
          approverName: '',
          remarks: '',
          approvedAt: null,
        },
        {
          name: 'Student Service',
          status: 'Pending',
          approvedBy: null,
          approverName: '',
          remarks: '',
          approvedAt: null,
        },
      ],
      submittedAt: new Date(Date.now() - 48*60*60*1000),
      completedAt: null,
    });
    
    await workflow.save();
    console.log('\n✅ Created test workflow:');
    console.log('   SAP ID:', workflow.sapid);
    console.log('   Student:', workflow.studentName);
    console.log('   _id:', workflow._id);
    console.log('   Status: Pending at Library phase');
    
    console.log('\n📊 FINAL STATE:');
    const total = await ClearanceWorkflow.countDocuments();
    console.log('Total workflows:', total);
    
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('   Library Staff Email: librarydebug@example.com');
    console.log('   Password: password123');
    console.log('   Role: library');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
