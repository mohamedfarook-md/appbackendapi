const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: process.env.PORT || 5000,

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!env.mongoUri) {
  console.error('❌ MONGODB_URI is missing in .env');
}

if (!env.jwtSecret) {
  console.error('❌ JWT_SECRET is missing in .env');
}

module.exports = env;