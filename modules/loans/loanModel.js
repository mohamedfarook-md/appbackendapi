const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry ID is required'],
      unique: true,
      index: true,
    },

    loanType: {
      type: String,
      required: [true, 'Loan type is required'],
      trim: true,
    },

    loanAmount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: 0,
    },

    tenure: {
      type: Number,
      default: null,
      min: 0,
    },

    employmentType: {
      type: String,
      trim: true,
      default: '',
    },

    monthlyIncome: {
      type: Number,
      default: null,
      min: 0,
    },

    monthlyObligations: {
      type: Number,
      default: null,
      min: 0,
    },

    existingLoans: {
      type: Boolean,
      default: false,
    },

    preferredLender: {
      type: String,
      trim: true,
      default: '',
    },

    purpose: {
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
        'DOCUMENT_PENDING',
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

loanSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'LoanLead',
  loanSchema
);