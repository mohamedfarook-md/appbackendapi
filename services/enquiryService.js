const Enquiry = require('../models/Enquiry');


// ======================================================
// Create Enquiry
// ======================================================

const createCustomerEnquiry = async ({
  customerId,
  serviceType,
  enquiryType,
  customerDetails,
  serviceDetails = {},
  source = 'Mobile App',
}) => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  if (!serviceType) {
    throw new Error('Service type is required');
  }

  if (!enquiryType) {
    throw new Error('Enquiry type is required');
  }

  if (!customerDetails) {
    throw new Error('Customer details are required');
  }


  const enquiry = await Enquiry.create({
    customerId,

    serviceType: String(serviceType).trim(),

    enquiryType: String(enquiryType).trim(),

    customerDetails: {
      fullName: String(
        customerDetails.fullName || ''
      ).trim(),

      mobile: String(
        customerDetails.mobile || ''
      ).trim(),

      email: String(
        customerDetails.email || ''
      )
        .trim()
        .toLowerCase(),

      dob: String(
        customerDetails.dob || ''
      ).trim(),

      age:
        customerDetails.age !== undefined &&
        customerDetails.age !== null &&
        customerDetails.age !== ''
          ? Number(customerDetails.age)
          : null,

      gender:
        customerDetails.gender || '',

      city: String(
        customerDetails.city || ''
      ).trim(),

      state: String(
        customerDetails.state || ''
      ).trim(),

      pincode: String(
        customerDetails.pincode || ''
      ).trim(),
    },

    serviceDetails:
      serviceDetails || {},

    status: 'NEW',

    assignedAgent: null,

    source,
  });


  return enquiry;
};


// ======================================================
// Get Customer Enquiries
// ======================================================

const getCustomerEnquiries = async (
  customerId
) => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  return Enquiry.find({
    customerId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
};


// ======================================================
// Get Single Customer Enquiry
// ======================================================

const getCustomerEnquiryById = async (
  customerId,
  enquiryId
) => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  if (!enquiryId) {
    throw new Error('Enquiry ID is required');
  }

  return Enquiry.findOne({
    _id: enquiryId,
    customerId,
  }).lean();
};


// ======================================================
// Export
// ======================================================

module.exports = {
  createCustomerEnquiry,
  getCustomerEnquiries,
  getCustomerEnquiryById,
};