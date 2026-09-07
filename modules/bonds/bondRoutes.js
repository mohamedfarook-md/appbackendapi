const express = require('express');

const {
  createBondLead,
  getBondLead,
  updateBondLead,
  getAllBondLeads,
} = require('./bondController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Bond APIs
|--------------------------------------------------------------------------
*/

// Get all bond leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllBondLeads
);

/*
|--------------------------------------------------------------------------
| Customer Bond APIs
|--------------------------------------------------------------------------
*/

// Create bond-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createBondLead
);

// Get bond details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getBondLead
);

// Update bond details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateBondLead
);

module.exports = router;