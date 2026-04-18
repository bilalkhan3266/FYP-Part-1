const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/role_based_system').then(async () => {
  // Find all unique roles
  const allRoles = await User.find().select('role').distinct('role');
  
  console.log('All unique roles in database:');
  allRoles.forEach(role => {
    console.log('  "' + role + '"');
  });
  
  // Show sample users for each role
  console.log('\nSample users:');
  for (const role of allRoles) {
    const user = await User.findOne({ role }).select('full_name role');
    if (user) {
      console.log(`  ${role}: ${user.full_name}`);
    }
  }
  
  process.exit(0);
}).catch(e => { 
  console.error('Error:', e.message); 
  process.exit(1); 
});
