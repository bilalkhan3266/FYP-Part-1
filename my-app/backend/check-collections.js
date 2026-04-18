#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const mongoose_url = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

async function checkModels() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    const conn = await mongoose.connect(mongoose_url);
    const db = conn.connection.db;
    
    console.log('✅ Connected\n');
    console.log('📋 AVAILABLE COLLECTIONS:\n');
    
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  • ${coll.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

checkModels();
