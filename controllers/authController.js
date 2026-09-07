const bcrypt = require('bcryptjs');

const User = require('../models/User');
const OTP = require('../models/OTP');

const env = require('../config/env');

const generateToken = require('../utils/generateToken');

const {
  isValidMobile,
  isValidEmail,
  isValidPassword,
  isValidOTP,
  isRequired,
} = require('../utils/validators');

const {
  createOTP,
  verifyOTP,
  deleteOTP,
} = require('../services/otpService');

const {
  successResponse,
  errorResponse,
} = require('../utils/response');


// ======================================================
// SIGNUP
// POST /api/auth/signup
// ======================================================

const registerCustomer = async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      email = '',
      password,
      confirmPassword,
    } = req.body;

    const cleanName = String(name || '').trim();
    const cleanMobile = String(mobile || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    // -----------------------------
    // Validation
    // -----------------------------

    if (!isRequired(cleanName)) {
      return errorResponse(res, 'Name is required', 400);
    }

    if (!isValidMobile(cleanMobile)) {
      return errorResponse(
        res,
        'Please enter a valid 10-digit mobile number',
        400
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return errorResponse(
        res,
        'Please enter a valid email address',
        400
      );
    }

    if (!isValidPassword(password)) {
      return errorResponse(
        res,
        'Password must contain at least 8 characters',
        400
      );
    }

    if (password !== confirmPassword) {
      return errorResponse(
        res,
        'Passwords do not match',
        400
      );
    }

    // -----------------------------
    // Check existing user
    // -----------------------------

    const existingUser = await User.findOne({
      mobile: cleanMobile,
    });

    if (existingUser) {
      return errorResponse(
        res,
        'An account already exists with this mobile number',
        409
      );
    }

    // -----------------------------
    // Hash password
    // -----------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // -----------------------------
    // Generate OTP
    // -----------------------------

    const otpData = await createOTP(
      cleanMobile,
      'signup'
    );

    // -----------------------------
    // Save signup data with OTP
    // -----------------------------

    await OTP.findByIdAndUpdate(
      otpData.otpId,
      {
        signupData: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
        },
      }
    );

    // -----------------------------
    // Development OTP
    // -----------------------------

    let developmentOTP = null;

    if (env.nodeEnv === 'development') {
      const otpRecord = await OTP
        .findById(otpData.otpId)
        .select('+otp');

      developmentOTP = otpRecord?.otp || null;
    }

    // -----------------------------
    // Response
    // -----------------------------

    const responseData = {
      otpId: otpData.otpId,
      mobile: cleanMobile,
      expiresAt: otpData.expiresAt,
      nextStep: 'OTP_VERIFICATION',
    };

    // IMPORTANT:
    // OTP is returned ONLY during development.
    if (env.nodeEnv === 'development') {
      responseData.otp = developmentOTP;
    }

    return successResponse(
      res,
      'OTP generated successfully',
      responseData,
      200
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// VERIFY SIGNUP OTP
// POST /api/auth/signup/verify-otp
// ======================================================

const verifySignupOTP = async (req, res, next) => {
  try {
    const {
      mobile,
      otp,
    } = req.body;

    const cleanMobile = String(mobile || '').trim();
    const cleanOTP = String(otp || '').trim();

    // -----------------------------
    // Validation
    // -----------------------------

    if (!isValidMobile(cleanMobile)) {
      return errorResponse(
        res,
        'Please enter a valid mobile number',
        400
      );
    }

    if (!isValidOTP(cleanOTP)) {
      return errorResponse(
        res,
        'Please enter a valid 6-digit OTP',
        400
      );
    }

    // -----------------------------
    // Check existing user
    // -----------------------------

    const existingUser = await User.findOne({
      mobile: cleanMobile,
    });

    if (existingUser) {
      return errorResponse(
        res,
        'An account already exists with this mobile number',
        409
      );
    }

    // -----------------------------
    // Find latest signup OTP
    // -----------------------------

    const otpRecord = await OTP
      .findOne({
        mobile: cleanMobile,
        purpose: 'signup',
        isVerified: false,
      })
      .sort({ createdAt: -1 })
      .select('+otp +signupData.password');

    if (!otpRecord) {
      return errorResponse(
        res,
        'OTP not found or already used',
        400
      );
    }

    // -----------------------------
    // Check expiry
    // -----------------------------

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return errorResponse(
        res,
        'OTP has expired. Please request a new OTP',
        400
      );
    }

    // -----------------------------
    // Check attempts
    // -----------------------------

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return errorResponse(
        res,
        'Maximum OTP attempts exceeded. Please request a new OTP',
        400
      );
    }

    // -----------------------------
    // Verify OTP
    // -----------------------------

    if (otpRecord.otp !== cleanOTP) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      const remainingAttempts =
        5 - otpRecord.attempts;

      return errorResponse(
        res,
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining`
          : 'Maximum OTP attempts exceeded. Please request a new OTP',
        400
      );
    }

    // -----------------------------
    // Validate signup data
    // -----------------------------

    if (
      !otpRecord.signupData ||
      !otpRecord.signupData.name ||
      !otpRecord.signupData.password
    ) {
      return errorResponse(
        res,
        'Signup session is invalid. Please register again',
        400
      );
    }

    // -----------------------------
    // Create user
    // -----------------------------

    const user = await User.create({
      name: otpRecord.signupData.name,
      mobile: cleanMobile,
      email: otpRecord.signupData.email || '',
      password: otpRecord.signupData.password,
      role: 'customer',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date(),
    });

    // -----------------------------
    // Mark OTP verified
    // -----------------------------

    otpRecord.isVerified = true;

    await otpRecord.save();

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // -----------------------------
    // Generate JWT
    // -----------------------------

    const token = generateToken(user._id);

    return successResponse(
      res,
      'Account created successfully',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      201
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// SEND LOGIN OTP
// POST /api/auth/login/send-otp
// ======================================================

const sendLoginOTPRequest = async (req, res, next) => {
  try {
    const {
      mobile,
    } = req.body;

    const cleanMobile = String(mobile || '').trim();

    if (!isValidMobile(cleanMobile)) {
      return errorResponse(
        res,
        'Please enter a valid 10-digit mobile number',
        400
      );
    }

    const user = await User.findOne({
      mobile: cleanMobile,
    });

    if (!user) {
      return errorResponse(
        res,
        'No account found with this mobile number',
        404
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        'Your account is inactive',
        403
      );
    }

    const otpData = await createOTP(
      cleanMobile,
      'login'
    );

    const responseData = {
      otpId: otpData.otpId,
      mobile: cleanMobile,
      expiresAt: otpData.expiresAt,
    };

    // Development only
    if (env.nodeEnv === 'development') {
      const otpRecord = await OTP
        .findById(otpData.otpId)
        .select('+otp');

      responseData.otp = otpRecord?.otp || null;
    }

    return successResponse(
      res,
      'OTP generated successfully',
      responseData
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// LOGIN WITH PASSWORD
// POST /api/auth/login
// ======================================================

const loginWithPassword = async (req, res, next) => {
  try {
    const {
      mobile,
      password,
    } = req.body;

    const cleanMobile = String(mobile || '').trim();

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

    const user = await User
      .findOne({ mobile: cleanMobile })
      .select('+password');

    if (!user) {
      return errorResponse(
        res,
        'Invalid mobile number or password',
        401
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        'Your account is inactive',
        403
      );
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return errorResponse(
        res,
        'Invalid mobile number or password',
        401
      );
    }

    user.lastLoginAt = new Date();

    await user.save();

    const token = generateToken(user._id);

    return successResponse(
      res,
      'Login successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// LOGIN WITH OTP
// POST /api/auth/login/otp
// ======================================================

const loginWithOTP = async (req, res, next) => {
  try {
    const {
      mobile,
      otp,
    } = req.body;

    const cleanMobile = String(mobile || '').trim();

    if (!isValidMobile(cleanMobile)) {
      return errorResponse(
        res,
        'Please enter a valid mobile number',
        400
      );
    }

    await verifyOTP(
      cleanMobile,
      otp,
      'login'
    );

    const user = await User.findOne({
      mobile: cleanMobile,
    });

    if (!user) {
      return errorResponse(
        res,
        'User not found',
        404
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        'Your account is inactive',
        403
      );
    }

    user.lastLoginAt = new Date();

    await user.save();

    await deleteOTP(
      cleanMobile,
      'login'
    );

    const token = generateToken(user._id);

    return successResponse(
      res,
      'Login successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      }
    );

  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400
    );
  }
};


// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

const getMe = async (req, res) => {
  return successResponse(
    res,
    'User profile fetched successfully',
    {
      user: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
        lastLoginAt: req.user.lastLoginAt,
      },
    }
  );
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  registerCustomer,
  verifySignupOTP,
  sendLoginOTP: sendLoginOTPRequest,
  loginWithPassword,
  loginWithOTP,
  getMe,
};