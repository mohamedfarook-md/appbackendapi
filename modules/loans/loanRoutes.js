const express = require('express');

const {
  createLoanLead,
  getLoanLead,
  updateLoanLead,
  getAllLoanLeads,
} = require('./loanController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Loan APIs
|--------------------------------------------------------------------------
*/

// Get all loan leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllLoanLeads
);

/*
|--------------------------------------------------------------------------
| Customer Loan APIs
|--------------------------------------------------------------------------
*/

// Create loan-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createLoanLead
);

// Get loan details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getLoanLead
);

// Update loan details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateLoanLead
);

module.exports = router;