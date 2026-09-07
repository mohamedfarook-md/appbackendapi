const express = require('express');

const {
  createRenewalLead,
  getRenewalLead,
  updateRenewalLead,
  getAllRenewalLeads,
} = require('./renewalController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Insurance Renewal APIs
|--------------------------------------------------------------------------
*/

// Get all insurance renewal leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllRenewalLeads
);

/*
|--------------------------------------------------------------------------
| Customer Insurance Renewal APIs
|--------------------------------------------------------------------------
*/

// Create renewal-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createRenewalLead
);

// Get renewal details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getRenewalLead
);

// Update renewal details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateRenewalLead
);

module.exports = router;