const mongoose = require('mongoose');

// Use Heroku environment variable or fallback local URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myLocalDB';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
