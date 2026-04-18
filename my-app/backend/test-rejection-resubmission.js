#!/usr/bin/env node

/**
 * Test Script: Rejection & Resubmission Workflow
 * 
 * Tests the complete flow:
 * 1. Approve from Library
 * 2. Reject from Transport
 * 3. Resubmit and auto-approve
 * 4. Final approval from all departments
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'your_admin_token_here'; // Get from browser localStorage after login

// Test student data
const TEST_REQUEST = {
  requestId: '63a1b2c3d4e5f6g7h8i9j0k1', // From ComprehensiveClearanceValidation
  studentSapId: '48397',
  studentName: 'Muhammad Bilal'
};

async function testRejectionFlow() {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TESTING REJECTION & RESUBMISSION WORKFLOW`);
    console.log(`${'='.repeat(70)}\n`);

    // Test 1: Approve from Library
    console.log(`TEST 1️⃣: Library Department Approves`);
    console.log(`─`.repeat(70));
    const approveLibrary = await axios.put(
      `${API_URL}/api/clearance/department/approve-or-reject`,
      {
        requestId: TEST_REQUEST.requestId,
        studentSapId: TEST_REQUEST.studentSapId,
        departmentName: 'Library',
        action: 'approve',
        remarks: 'No outstanding returns'
      },
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    console.log(`✅ Response:`, approveLibrary.data);
    console.log();

    // Test 2: Reject from Transport
    console.log(`TEST 2️⃣: Transport Department Rejects`);
    console.log(`─`.repeat(70));
    const rejectTransport = await axios.put(
      `${API_URL}/api/clearance/department/approve-or-reject`,
      {
        requestId: TEST_REQUEST.requestId,
        studentSapId: TEST_REQUEST.studentSapId,
        departmentName: 'Transport',
        action: 'reject',
        remarks: 'Outstanding bus fare not paid'
      },
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    console.log(`✅ Response:`, rejectTransport.data);
    console.log(`\n⚠️  Status should now show "Rejected" in Transport dashboard\n`);

    // Test 3: Student Resubmits
    console.log(`TEST 3️⃣: Student Resubmits After Fixing Issues`);
    console.log(`─`.repeat(70));
    const resubmit = await axios.post(
      `${API_URL}/api/clearance/department/resubmit`,
      {
        requestId: TEST_REQUEST.requestId,
        department: 'Transport'
      },
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    console.log(`✅ Response:`, resubmit.data);
    console.log(`\n✨ Status should now be "Approved" or "Pending" depending on issue resolution\n`);

    // Test 4: Approve from remaining departments
    console.log(`TEST 4️⃣: Approve from Remaining Departments`);
    console.log(`─`.repeat(70));

    const departments = ['Coordination', 'Fee Department', 'Student Service'];
    for (const dept of departments) {
      const result = await axios.put(
        `${API_URL}/api/clearance/department/approve-or-reject`,
        {
          requestId: TEST_REQUEST.requestId,
          studentSapId: TEST_REQUEST.studentSapId,
          departmentName: dept,
          action: 'approve',
          remarks: 'Approved'
        },
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      console.log(`✅ ${dept}: ${result.data.data.status}`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎉 COMPLETE FLOW TEST FINISHED`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nExpected Final Status:`);
    console.log(`  • overallStatus: "Completed"`);
    console.log(`  • All departments: "Approved"`);
    console.log(`  • Student moves to Admin Dashboard "Approved" tab`);
    console.log(`  • Certificate generated automatically\n`);

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

// Run tests
testRejectionFlow();
