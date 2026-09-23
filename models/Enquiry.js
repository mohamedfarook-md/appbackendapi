const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Enquiry Identification
    |--------------------------------------------------------------------------
    */

    enquiryId: {
      type: String,
      unique: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Service Information
    |--------------------------------------------------------------------------
    */

    serviceType: {
      type: String,
      enum: [
        'Insurance',
        'Insurance Renewal',
        'Loans',
        'FD',
        'RD',
        'Bonds',
        'Investments',
        'Shares',
        'Credit Card',
        'Soundbox',
      ],
      required: [true, 'Service type is required'],
      index: true,
    },

    enquiryType: {
      type: String,
      required: [true, 'Enquiry type is required'],
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Customer Details
    |--------------------------------------------------------------------------
    */

    customerDetails: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      mobile: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },

      dob: {
        type: String,
        default: '',
      },

      age: {
        type: Number,
        default: null,
      },

      gender: {
        type: String,
        enum: ['Male', 'Female', ''],
        default: '',
      },

      city: {
        type: String,
        trim: true,
        default: '',
      },

      state: {
        type: String,
        trim: true,
        default: '',
      },

      pincode: {
        type: String,
        trim: true,
        default: '',
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Service Specific Details
    |--------------------------------------------------------------------------
    */

    serviceDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    |--------------------------------------------------------------------------
    | Lead Status
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Assignment
    |--------------------------------------------------------------------------
    */

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Admin Notes
    |--------------------------------------------------------------------------
    */

    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },




    /*
|--------------------------------------------------------------------------
| Status Reason / Objection
|--------------------------------------------------------------------------
*/

statusReason: {
  type: String,
  trim: true,
  default: '',
},

    /*
    |--------------------------------------------------------------------------
    | Source
    |--------------------------------------------------------------------------
    */

    source: {
      type: String,
      enum: ['Mobile App', 'Admin', 'Agent'],
      default: 'Mobile App',
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

enquirySchema.index({
  serviceType: 1,
  status: 1,
});

enquirySchema.index({
  createdAt: -1,
});

enquirySchema.index({
  'customerDetails.mobile': 1,
});

/*
|--------------------------------------------------------------------------
| Generate Enquiry ID
|--------------------------------------------------------------------------
*/

enquirySchema.pre('save', async function (next) {
  if (!this.isNew || this.enquiryId) {
    return next();
  }

  const prefixMap = {
    Insurance: 'INS',
    'Insurance Renewal': 'REN',
    Loans: 'LOAN',
    FD: 'FD',
    RD: 'RD',
    Bonds: 'BOND',
    Investments: 'INV',
    Shares: 'SHARE',
      'Credit Card': 'CC',
  Soundbox: 'SBOX',
  };

  const prefix = prefixMap[this.serviceType] || 'ENQ';

  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  /*
  |--------------------------------------------------------------------------
  | Find today's latest enquiry
  |--------------------------------------------------------------------------
  */

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const latestEnquiry = await this.constructor
    .findOne({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
    .sort({
      createdAt: -1,
    });

  let sequence = 1;

  if (latestEnquiry?.enquiryId) {
    const parts = latestEnquiry.enquiryId.split('-');
    const lastPart = parts[parts.length - 1];

    const lastSequence = parseInt(
      lastPart,
      10
    );

    if (!Number.isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  const sequenceNumber = String(
    sequence
  ).padStart(5, '0');

  this.enquiryId =
    `MHSP-${prefix}-${year}${month}${day}-${sequenceNumber}`;

  next();
});

module.exports = mongoose.model(
  'Enquiry',
  enquirySchema
);