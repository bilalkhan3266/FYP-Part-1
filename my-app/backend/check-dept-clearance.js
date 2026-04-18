#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const mongoose_url = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';
const DepartmentClearance = require('./models/DepartmentClearance');

async function checkDepartmentClearances() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(mongoose_url);
    console.log('✅ Connected\n');

    console.log('📊 DEPARTMENT CLEARANCE STATUS DISTRIBUTION:\n');
    
    const statuses = await DepartmentClearance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('By Status:');
    statuses.forEach(s => {
      console.log(`  • ${s._id || '(null)'}: ${s.count}`);
    });

    console.log('\n📍 BY DEPARTMENT:\n');
    const departments = await DepartmentClearance.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }, rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } },
      { $sort: { total: -1 } }
    ]);

    departments.forEach(d => {
      console.log(`  ${d._id}:`);
      console.log(`    Total: ${d.total}, Approved: ${d.approved}, Rejected: ${d.rejected}, Pending: ${d.pending}`);
    });

    console.log('\n📈 OVERALL:\n');
    const overall = await DepartmentClearance.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }, rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } }
    ]);

    if (overall.length > 0) {
      const o = overall[0];
      console.log(`  Total Requests: ${o.total}`);
      console.log(`  Approved: ${o.approved}`);
      console.log(`  Rejected: ${o.rejected}`);
      console.log(`  Pending: ${o.pending}`);
    }

    console.log('\n✅ Check complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

checkDepartmentClearances();
