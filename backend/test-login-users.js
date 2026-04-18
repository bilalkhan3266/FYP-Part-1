require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(e => {console.error('❌ Connection error:', e.message); process.exit(1);});

setTimeout(async () => {
  try {
    const users = await User.find({role: 'student'}).limit(5).select('email full_name -_id');
    console.log('\n📚 First 5 Student Accounts:');
    users.forEach((u, i) => console.log(`  ${i+1}. ${u.email} (${u.full_name})`));
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}, 1000);
