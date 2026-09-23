const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },

    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number'],
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

    role: {
      type: String,
      enum: ['customer', 'admin', 'agent'],
      default: 'customer',
    },

    companyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  default: null,
},

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },


    pushTokens: [
  {
    token: {
      type: String,
      required: true,
    },

    platform: {
      type: String,
      enum: ['android', 'ios'],
      default: 'android',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
],
      lastLeadExportAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);