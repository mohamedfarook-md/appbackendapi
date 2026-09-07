const bcrypt = require('bcryptjs');

const User = require('../models/User');

const generateToken = require('../utils/generateToken');

const {
  isValidMobile,
  isRequired,
} = require('../utils/validators');

const {
  successResponse,
  errorResponse,
} = require('../utils/response');


// ======================================================
// ADMIN LOGIN
// POST /api/admin/auth/login
// ======================================================

const adminLogin = async (req, res, next) => {
  try {
    const {
      mobile,
      password,
    } = req.body;

    const cleanMobile =
      String(mobile || '').trim();

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    if (!isValidMobile(cleanMobile)) {
      return errorResponse(
        res,
        'Please enter a valid 10-digit mobile number',
        400
      );
    }

    if (!isRequired(password)) {
      return errorResponse(
        res,
        'Password is required',
        400
      );
    }

    // --------------------------------------------------
    // Find admin
    // --------------------------------------------------

    const admin = await User
      .findOne({
        mobile: cleanMobile,
        role: 'admin',
      })
      .select('+password');

    if (!admin) {
      return errorResponse(
        res,
        'Invalid admin mobile number or password',
        401
      );
    }

    // --------------------------------------------------
    // Check account status
    // --------------------------------------------------

    if (!admin.isActive) {
      return errorResponse(
        res,
        'Admin account is inactive',
        403
      );
    }

    // --------------------------------------------------
    // Verify password
    // --------------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordMatch) {
      return errorResponse(
        res,
        'Invalid admin mobile number or password',
        401
      );
    }

    // --------------------------------------------------
    // Update last login
    // --------------------------------------------------

    admin.lastLoginAt = new Date();

    await admin.save();

    // --------------------------------------------------
    // Generate JWT
    // --------------------------------------------------

    const token =
      generateToken(admin._id);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return successResponse(
      res,
      'Admin login successful',
      {
        token,

        user: {
          id: admin._id,
          name: admin.name,
          mobile: admin.mobile,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          isVerified: admin.isVerified,
          lastLoginAt: admin.lastLoginAt,
        },
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET ADMIN PROFILE
// GET /api/admin/auth/me
// ======================================================

const getAdminProfile = async (
  req,
  res
) => {
  return successResponse(
    res,
    'Admin profile fetched successfully',
    {
      admin: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        isVerified: req.user.isVerified,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
      },
    }
  );
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  adminLogin,
  getAdminProfile,
};