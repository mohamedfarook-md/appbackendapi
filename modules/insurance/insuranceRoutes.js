const express = require('express');

const {
  createInsuranceLead,
  getInsuranceLead,
  updateInsuranceLead,
  getAllInsuranceLeads,
} = require('./insuranceController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Insurance APIs
|--------------------------------------------------------------------------
*/

router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllInsuranceLeads
);

/*
|--------------------------------------------------------------------------
| Customer Insurance APIs
|--------------------------------------------------------------------------
*/

router.post(
  '/',
  protect,
  customerOnly,
  createInsuranceLead
);

router.get(
  '/:enquiryId',
  protect,
  customerOnly,
  getInsuranceLead
);

router.put(
  '/:enquiryId',
  protect,
  customerOnly,
  updateInsuranceLead
);

module.exports = router;