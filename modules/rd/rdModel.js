const mongoose = require('mongoose');

const rdSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    rdType: {
      type: String,
      required: [true, 'RD type is required'],
      trim: true,
    },

    monthlyInvestment: {
      type: Number,
      required: [true, 'Monthly investment is required'],
      min: 0,
    },

    tenure: {
      type: Number,
      required: [true, 'Tenure is required'],
      min: 0,
    },

    preferredInstitution: {
      type: String,
      trim: true,
      default: '',
    },

    paymentFrequency: {
      type: String,
      trim: true,
      default: 'Monthly',
    },

    maturityPreference: {
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

rdSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'RDLead',
  rdSchema
);