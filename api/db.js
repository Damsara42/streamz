const mongoose = require('mongoose');

// Use local MongoDB or your Cloud URL
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/streamhub';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected successfully.');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;