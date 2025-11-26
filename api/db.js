const mongoose = require('mongoose');

// Use local MongoDB or your Cloud URL
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://yamemizukimizuki2000_db_user:SABfAchpwXAGGbVQ@streamz.8cqjslk.mongodb.net/?appName=streamz';

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