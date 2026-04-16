const axios = require('axios');

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

async function testSequentialValidator() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('    TESTING SEQUENTIAL VALIDATOR FIX');
    console.log('='.repeat(80) + '\n');
    
    // Step 1: Submit clearance for student with Fee Department rejection
    console.log('📝 STEP 1: Submitting clearance request for Shahzaib (SAP: 60)...\n');
    
    const clearanceResponse = await API.post('/clearance-requests', {
      student_id: 60,
      program: 'BS(CS)',
      semester: '8'
    });

    if (clearanceResponse.status === 200 || clearanceResponse.status === 201) {
      console.log('✅ Clearance request submitted successfully!\n');
      
      // Step 2: Get clearance status
      console.log('📊 STEP 2: Fetching clearance status...\n');
      
      const statusResponse = await API.get('/clearance-status', {
        params: { student_id: 60 }
      });

      if (statusResponse.status === 200) {
        const data = statusResponse.data.data || statusResponse.data;
        
        console.log('📋 CLEARANCE STATUS RESULT:\n');
        console.log('Student:', data.student_name || 'Unknown');
        console.log('SAP ID:', data.sapid);
        console.log('Overall Status:', data.overallStatus);
        console.log('\n🏛️  DEPARTMENT STATUSES:\n');
        
        // Check each department
        let feeDeptRejected = false;
        let studentServiceStatus = null;
        
        data.departmentStatuses.forEach((dept, idx) => {
          const status = dept.status;
          let statusIcon = '❓';
          
          if (status === 'Approved') {
            statusIcon = '✅';
          } else if (status === 'Rejected') {
            statusIcon = '❌';
          } else if (status === 'Not Processed') {
            statusIcon = '⏳';
          }
          
          console.log(`  ${statusIcon} [${idx + 1}/5] ${dept.name}: ${status}`);
          
          if (dept.name === 'Fee Department' && status === 'Rejected') {
            feeDeptRejected = true;
            console.log(`      Reason: ${dept.reason}`);
          }
          
          if (dept.name === 'Student Service') {
            studentServiceStatus = status;
          }
        });
        
        // Verify the fix
        console.log('\n' + '='.repeat(80));
        console.log('    VERIFICATION RESULTS');
        console.log('='.repeat(80) + '\n');
        
        if (feeDeptRejected) {
          console.log('✅ Fee Department correctly marked as REJECTED\n');
          
          if (studentServiceStatus === 'Not Processed') {
            console.log('✅ Student Service correctly marked as NOT PROCESSED (blocking fix WORKS!)\n');
            console.log('🎉 FIX SUCCESSFUL! Sequential validation with early stopping is working!\n');
          } else if (studentServiceStatus === 'Approved') {
            console.log('❌ Student Service still marked as APPROVED (bug still exists)\n');
            console.log('⚠️  FIX FAILED! The validator is still checking all departments.\n');
          } else {
            console.log('❓ Student Service status: ' + studentServiceStatus + '\n');
          }
        } else {
          console.log('⚠️  Fee Department not rejected. Check if student still has pending fees.\n');
        }
        
      }
    }

  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testSequentialValidator();
