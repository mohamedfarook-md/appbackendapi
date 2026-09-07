const express = require('express');

const {
  createFDLead,
  getFDLead,
  updateFDLead,
  getAllFDLeads,
} = require('./fdController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin FD APIs
|--------------------------------------------------------------------------
*/

// Get all FD leads
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllFDLeads
);

/*
|--------------------------------------------------------------------------
| Customer FD APIs
|--------------------------------------------------------------------------
*/

// Create FD-specific details
router.post(
  '/',
  protect,
  customerOnly,
  createFDLead
);

// Get FD details by enquiry ID
router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getFDLead
);

// Update FD details
router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateFDLead
);

module.exports = router;