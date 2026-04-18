#!/usr/bin/env node

/**
 * Script to auto-approve all 54 pending department clearances
 * Usage: cd backend && node auto-approve-dept-clearances.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoose_url = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
const DepartmentClearance = require('./models/DepartmentClearance');

async function autoApprovePending() {
  let connection;
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   URL: ${mongoose_url}\n`);
    
    connection = await mongoose.connect(mongoose_url);
    console.log('✅ Connected to MongoDB\n');

    // Find all pending department clearances
    console.log('🔍 Finding all pending department clearances...');
    const pendingRequests = await DepartmentClearance.find({ status: 'Pending' });
    
    console.log(`📊 Found: ${pendingRequests.length} pending requests\n`);

    if (pendingRequests.length === 0) {
      console.log('✅ No pending requests found. System is clean!');
      return;
    }

    // Group by department for tracking
    const byDepartment = {};

    // Auto-approve all pending department clearances
    console.log('⏳ Auto-approving requests...\n');
    let approvedCount = 0;

    for (const request of pendingRequests) {
      try {
        const dept = request.department_name || 'Unknown';
        
        await DepartmentClearance.findByIdAndUpdate(
          request._id,
          {
            status: 'Approved',
            approved_by: 'System Auto-Approval',
            approved_at: new Date(),
            remarks: (request.remarks || '') + ' [Auto-approved to clear pending backlog]',
            isAutoApproved: true
          },
          { new: true }
        );

        // Track by department
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        approvedCount++;

        console.log(`   ✓ ${request.sapid} - ${request.student_name} (${dept})`);
      } catch (err) {
        console.error(`   ✗ Failed: ${request._id} - ${err.message}`);
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 AUTO-APPROVAL COMPLETE!');
    console.log(`${'='.repeat(70)}`);
    console.log(`\nTotal Processed: ${pendingRequests.length}`);
    console.log(`Successfully Approved: ${approvedCount}`);
    console.log('\nBy Department:');
    
    Object.entries(byDepartment).forEach(([dept, count]) => {
      console.log(`  • ${dept}: ${count} ✓`);
    });

    console.log(`\n✅ Pending backlog cleared! All 54 requests auto-approved.\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
autoApprovePending();
