const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    investmentType: {
      type: String,
      required: [true, 'Investment type is required'],
      trim: true,
    },

    investmentAmount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 0,
    },

    investmentHorizon: {
      type: String,
      trim: true,
      default: '',
    },

    investmentGoal: {
      type: String,
      trim: true,
      default: '',
    },

    riskPreference: {
      type: String,
      trim: true,
      default: '',
    },

    preferredPlatform: {
      type: String,
      trim: true,
      default: '',
    },

    expectedReturn: {
      type: Number,
      default: null,
      min: 0,
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

investmentSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'InvestmentLead',
  investmentSchema
);