const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    shareType: {
      type: String,
      required: [true, 'Share type is required'],
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

    riskPreference: {
      type: String,
      trim: true,
      default: '',
    },

    preferredMarket: {
      type: String,
      trim: true,
      default: '',
    },

    preferredSector: {
      type: String,
      trim: true,
      default: '',
    },

    investmentGoal: {
      type: String,
      trim: true,
      default: '',
    },

    dematStatus: {
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

shareSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'ShareLead',
  shareSchema
);