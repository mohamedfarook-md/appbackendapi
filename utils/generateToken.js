const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to generate token');
  }

  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: userId.toString(),
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

module.exports = generateToken;