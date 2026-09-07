const express = require('express');

const {
  createEnquiry,
  getMyEnquiries,
  getMyEnquiryById,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  assignEnquiryAgent,
} = require('../controllers/enquiryController');

const {
  protect,
  customerOnly,
  adminOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer Enquiry APIs
|--------------------------------------------------------------------------
*/

/*
 * Submit new enquiry
 * POST /api/enquiries
 */
router.post(
  '/',
  protect,
  customerOnly,
  createEnquiry
);

/*
 * Get logged-in customer's enquiries
 * GET /api/enquiries/my
 */
router.get(
  '/my',
  protect,
  customerOnly,
  getMyEnquiries
);

/*
 * Get logged-in customer's single enquiry
 * GET /api/enquiries/my/:id
 */
router.get(
  '/my/:id',
  protect,
  customerOnly,
  getMyEnquiryById
);

/*
|--------------------------------------------------------------------------
| Admin Enquiry APIs
|--------------------------------------------------------------------------
*/

/*
 * Get all enquiries
 * GET /api/enquiries/admin/all
 */
router.get(
  '/admin/all',
  protect,
  adminOnly,
  getAllEnquiries
);

/*
 * Get single enquiry
 * GET /api/enquiries/admin/:id
 */
router.get(
  '/admin/:id',
  protect,
  adminOnly,
  getEnquiryById
);

/*
 * Update enquiry status
 * PUT /api/enquiries/admin/:id/status
 */
router.put(
  '/admin/:id/status',
  protect,
  adminOnly,
  updateEnquiryStatus
);

/*
 * Assign enquiry to agent
 * PUT /api/enquiries/admin/:id/assign
 */
router.put(
  '/admin/:id/assign',
  protect,
  adminOnly,
  assignEnquiryAgent
);

module.exports = router;