const express = require('express');

const {
  createShareLead,
  getShareLead,
  updateShareLead,
  getAllShareLeads,
} = require('./shareController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Shares APIs
|--------------------------------------------------------------------------
*/

// Get all share leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllShareLeads
);

/*
|--------------------------------------------------------------------------
| Customer Shares APIs
|--------------------------------------------------------------------------
*/

// Create share-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createShareLead
);

// Get share details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getShareLead
);

// Update share details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateShareLead
);

module.exports = router;