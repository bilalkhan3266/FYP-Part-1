#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const mongoose_url = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
const ClearanceRequest = require('./models/ClearanceRequest');

async function autoApprovePending() {
  let connection;
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   URL: ${mongoose_url}\n`);
    
    connection = await mongoose.connect(mongoose_url);
    console.log('✅ Connected to MongoDB\n');

    // Find all pending clearance requests (where status is 'pending')
    console.log('🔍 Finding all pending requests...');
    const pendingRequests = await ClearanceRequest.find({ status: 'pending' });
    
    console.log(`📊 Found: ${pendingRequests.length} pending requests\n`);

    if (pendingRequests.length === 0) {
      console.log('✅ No pending requests found. System is clean!');
      return;
    }

    // Group by department for tracking
    const byDepartment = {};

    // Auto-approve all pending requests
    console.log('⏳ Auto-approving requests...\n');
    let approvedCount = 0;

    for (const request of pendingRequests) {
      try {
        const dept = request.department || 'Unknown';
        
        await ClearanceRequest.findByIdAndUpdate(
          request._id,
          {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: 'System Auto-Approval',
            remarks: 'Auto-approved to clear pending backlog'
          },
          { new: true }
        );

        // Track by department
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        approvedCount++;

        console.log(`   ✓ ${request.sap_id || request.sapid} - ${dept}`);
      } catch (err) {
        console.error(`   ✗ Failed: ${request._id}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 AUTO-APPROVAL COMPLETE!');
    console.log(`${'='.repeat(60)}`);
    console.log(`\nTotal Processed: ${pendingRequests.length}`);
    console.log(`Successfully Approved: ${approvedCount}`);
    console.log('\nBy Department:');
    
    Object.entries(byDepartment).forEach(([dept, count]) => {
      console.log(`  • ${dept}: ${count} ✓`);
    });

    console.log(`\n✅ Pending backlog cleared!\n`);

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
