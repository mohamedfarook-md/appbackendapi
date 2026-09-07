const express = require('express');

const {
  createRDLead,
  getRDLead,
  updateRDLead,
  getAllRDLeads,
} = require('./rdController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin RD APIs
|--------------------------------------------------------------------------
*/

// Get all RD leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllRDLeads
);

/*
|--------------------------------------------------------------------------
| Customer RD APIs
|--------------------------------------------------------------------------
*/

// Create RD-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createRDLead
);

// Get RD details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getRDLead
);

// Update RD details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateRDLead
);

module.exports = router;