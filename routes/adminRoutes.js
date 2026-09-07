const express = require('express');

const {
  getDashboard,
  getAgents,
  getAgentById,
  getRecentEnquiries,
  getUnassignedEnquiries,
} = require('../controllers/adminController');

const {
  protect,
  adminOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

/*
 * Get admin dashboard summary
 * GET /api/admin/dashboard
 */
router.get(
  '/dashboard',
  protect,
  adminOnly,
  getDashboard
);


/*
|--------------------------------------------------------------------------
| Agent Management
|--------------------------------------------------------------------------
*/

/*
 * Get all active agents
 * GET /api/admin/agents
 */
router.get(
  '/agents',
  protect,
  adminOnly,
  getAgents
);


/*
 * Get single agent details
 * GET /api/admin/agents/:id
 */
router.get(
  '/agents/:id',
  protect,
  adminOnly,
  getAgentById
);


/*
|--------------------------------------------------------------------------
| Enquiry Dashboard
|--------------------------------------------------------------------------
*/

/*
 * Get recent enquiries
 * GET /api/admin/recent-enquiries
 */
router.get(
  '/recent-enquiries',
  protect,
  adminOnly,
  getRecentEnquiries
);


/*
 * Get unassigned enquiries
 * GET /api/admin/unassigned-enquiries
 */
router.get(
  '/unassigned-enquiries',
  protect,
  adminOnly,
  getUnassignedEnquiries
);


module.exports = router;