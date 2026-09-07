const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Mobile Number
    |--------------------------------------------------------------------------
    */

    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number'],
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | OTP
    |--------------------------------------------------------------------------
    */

    otp: {
      type: String,
      required: [true, 'OTP is required'],
      select: false,
    },

    /*
    |--------------------------------------------------------------------------
    | OTP Purpose
    |--------------------------------------------------------------------------
    */

    purpose: {
      type: String,
      enum: [
        'signup',
        'login',
        'forgot_password',
      ],
      required: [true, 'OTP purpose is required'],
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Pending Signup Details
    |--------------------------------------------------------------------------
    |
    | These details are stored temporarily until OTP verification.
    | User account is NOT created until OTP is successfully verified.
    |
    */

    signupData: {
      name: {
        type: String,
        trim: true,
        default: '',
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },

      password: {
        type: String,
        select: false,
        default: '',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | OTP Attempts
    |--------------------------------------------------------------------------
    */

    attempts: {
      type: Number,
      default: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Verification Status
    |--------------------------------------------------------------------------
    */

    isVerified: {
      type: Boolean,
      default: false,
    },

    /*
    |--------------------------------------------------------------------------
    | Expiry
    |--------------------------------------------------------------------------
    */

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Automatically Delete Expired OTP Records
|--------------------------------------------------------------------------
*/

otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
  'OTP',
  otpSchema
);