const jwt = require('jsonwebtoken');

const env = require('../config/env');

const generateResetToken = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to generate reset token');
  }

  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: userId.toString(),
      purpose: 'password_reset',
    },
    env.jwtSecret,
    {
      expiresIn: '10m',
    }
  );
};

module.exports = generateResetToken;