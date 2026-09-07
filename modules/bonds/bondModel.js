const mongoose = require('mongoose');

const bondSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    bondType: {
      type: String,
      required: [true, 'Bond type is required'],
      trim: true,
    },

    investmentAmount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 0,
    },

    investmentTenure: {
      type: Number,
      default: null,
      min: 0,
    },

    preferredIssuer: {
      type: String,
      trim: true,
      default: '',
    },

    expectedReturn: {
      type: Number,
      default: null,
      min: 0,
    },

    interestPayoutPreference: {
      type: String,
      trim: true,
      default: '',
    },

    investmentPurpose: {
      type: String,
      trim: true,
      default: '',
    },

    additionalRequirements: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: [
        'NEW',
        'CONTACTED',
        'IN_PROGRESS',
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'CLOSED',
      ],
      default: 'NEW',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bondSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'BondLead',
  bondSchema
);