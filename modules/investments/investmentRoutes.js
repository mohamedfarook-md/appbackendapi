const express = require('express');

const {
  createInvestmentLead,
  getInvestmentLead,
  updateInvestmentLead,
  getAllInvestmentLeads,
} = require('./investmentController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Investment APIs
|--------------------------------------------------------------------------
*/

// Get all investment leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllInvestmentLeads
);

/*
|--------------------------------------------------------------------------
| Customer Investment APIs
|--------------------------------------------------------------------------
*/

// Create investment-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createInvestmentLead
);

// Get investment details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getInvestmentLead
);

// Update investment details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateInvestmentLead
);

module.exports = router;