const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error('MONGODB_URI is not configured');
    }

    const conn = await mongoose.connect(env.mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed');
    console.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;