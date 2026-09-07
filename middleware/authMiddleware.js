const jwt = require('jsonwebtoken');

const User = require('../models/User');
const env = require('../config/env');

const protect = async (req, res, next) => {
  try {
    let token;

    /*
    |--------------------------------------------------------------------------
    | Get JWT from Authorization Header
    |--------------------------------------------------------------------------
    */

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify JWT
    |--------------------------------------------------------------------------
    */

    const decoded = jwt.verify(token, env.jwtSecret);

    /*
    |--------------------------------------------------------------------------
    | Find User
    |--------------------------------------------------------------------------
    */

    const user = await User.findById(decoded.userId).select(
      '-password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Account Status
    |--------------------------------------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Attach User to Request
    |--------------------------------------------------------------------------
    */

    req.user = user;

    next();
  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/*
|--------------------------------------------------------------------------
| Customer Only
|--------------------------------------------------------------------------
*/

const customerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required.',
    });
  }

  next();
};

/*
|--------------------------------------------------------------------------
| Admin Only
|--------------------------------------------------------------------------
*/

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }

  next();
};

/*
|--------------------------------------------------------------------------
| Agent Only
|--------------------------------------------------------------------------
*/

const agentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Agent access required.',
    });
  }

  next();
};

module.exports = {
  protect,
  customerOnly,
  adminOnly,
  agentOnly,
};