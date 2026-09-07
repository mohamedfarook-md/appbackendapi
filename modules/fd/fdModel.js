const mongoose = require('mongoose');

const fdSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    fdType: {
      type: String,
      required: [true, 'FD type is required'],
      trim: true,
    },

    investmentAmount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 0,
    },

    tenure: {
      type: Number,
      default: null,
      min: 0,
    },

    preferredInstitution: {
      type: String,
      trim: true,
      default: '',
    },

    payoutPreference: {
      type: String,
      trim: true,
      default: '',
    },

    interestPayoutFrequency: {
      type: String,
      trim: true,
      default: '',
    },

    maturityPreference: {
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

fdSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'FDLead',
  fdSchema
);