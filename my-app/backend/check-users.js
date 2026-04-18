const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/role_based_system').then(async () => {
  const roles = await User.aggregate([{ 
    $group: { 
      _id: '$role', 
      count: { $sum: 1 } 
    } 
  }]);
  
  console.log('Users by role:');
  roles.sort((a, b) => b.count - a.count).forEach(r => {
    console.log('  ' + (r._id || 'null') + ':', r.count);
  });
  
  // Check specifically for library users
  const libraryUsers = await User.find({ role: 'library' }).select('full_name email');
  console.log('\nLibrary users:', libraryUsers.length);
  libraryUsers.forEach(u => console.log('  -', u.full_name, u.email));
  
  process.exit(0);
}).catch(e => { 
  console.error('Error:', e.message); 
  process.exit(1); 
});
