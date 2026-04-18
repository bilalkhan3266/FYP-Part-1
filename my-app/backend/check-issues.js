const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

mongoose.connect(MONGO_URI).then(async () => {
  const DepartmentIssue = require('./models/DepartmentIssue');
  
  const issues = await DepartmentIssue.find({ studentId: '260' });
  console.log('\n📋 DepartmentIssue records for SAP 260:');
  console.log('Total:', issues.length);
  
  if (issues.length === 0) {
    console.log('✅ NO UNCLEARED ISSUES FOUND - Should trigger AUTO-APPROVAL');
  } else {
    issues.forEach(i => {
      const isCleared = i.status === 'Cleared';
      const symbol = isCleared ? '✅' : '⚠️';
      console.log(`${symbol} - ${i.departmentName} | ${i.itemType} | Status: ${i.status} | ${i.description}`);
    });
    
    const unclearedCount = issues.filter(i => i.status !== 'Cleared').length;
    if (unclearedCount > 0) {
      console.log(`\n❌ ${unclearedCount} UNCLEARED ISSUE(S) - AUTO-APPROVAL BLOCKED`);
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
