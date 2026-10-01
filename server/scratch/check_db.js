require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log('Testing mongoose connection to:', uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Successfully connected to MongoDB!');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

check();
