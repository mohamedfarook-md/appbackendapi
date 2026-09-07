const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    existingInsurer: {
      type: String,
      required: [true, 'Existing insurer is required'],
      trim: true,
    },

    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      trim: true,
      uppercase: true,
    },

    policyType: {
      type: String,
      trim: true,
      default: '',
    },

    policyStartDate: {
      type: String,
      trim: true,
      default: '',
    },

    policyExpiryDate: {
      type: String,
      required: [true, 'Policy expiry date is required'],
      trim: true,
    },

    sumInsured: {
      type: Number,
      default: null,
      min: 0,
    },

    currentPremium: {
      type: Number,
      default: null,
      min: 0,
    },

    renewalRequirement: {
      type: String,
      trim: true,
      default: '',
    },

    preferredInsurer: {
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

renewalSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'InsuranceRenewalLead',
  renewalSchema
);