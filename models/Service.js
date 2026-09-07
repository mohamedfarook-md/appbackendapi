const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    serviceCode: {
      type: String,
      required: [true, 'Service code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },

    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: String,
      trim: true,
      default: 'Financial Services',
    },

    icon: {
      type: String,
      trim: true,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    enquiryEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({
  isActive: 1,
  displayOrder: 1,
});

module.exports = mongoose.model('Service', serviceSchema);