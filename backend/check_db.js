
const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27017/stationery_management';

async function check() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('Successfully connected to MongoDB');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

check();
