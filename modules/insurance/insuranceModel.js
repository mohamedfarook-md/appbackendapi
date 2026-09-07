const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    insuranceType: {
      type: String,
      required: [true, 'Insurance type is required'],
      trim: true,
    },

    insuranceRequirement: {
      type: String,
      trim: true,
      default: '',
    },

    preferredInsurer: {
      type: String,
      trim: true,
      default: '',
    },

    coverageAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    policyTerm: {
      type: Number,
      default: null,
      min: 0,
    },

    premiumBudget: {
      type: Number,
      default: null,
      min: 0,
    },

    existingPolicy: {
      type: Boolean,
      default: false,
    },

    existingPolicyNumber: {
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

insuranceSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model('InsuranceLead', insuranceSchema);