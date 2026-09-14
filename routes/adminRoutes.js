const express = require('express');

const {
  // Dashboard APIs
  getDashboardSummary,
  getRegistrationTrend,
  getServiceDistribution,
  getDashboardRecentLeads,
  getDashboardRecentRegistrations,
  getAgentPerformanceSummary,

  // Existing APIs
  getDashboard,
  getAgents,
  getAgentById,
  getRecentEnquiries,
  getUnassignedEnquiries,

  getCustomers,
getCustomerById,
} = require('../controllers/adminController');

const {
  protect,
  adminOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================================
// ADMIN DASHBOARD
// ======================================================

// GET /api/admin/dashboard/summary
router.get(
  '/dashboard/summary',
  protect,
  adminOnly,
  getDashboardSummary
);


// GET /api/admin/dashboard/registration-trend
router.get(
  '/dashboard/registration-trend',
  protect,
  adminOnly,
  getRegistrationTrend
);


// GET /api/admin/dashboard/service-distribution
router.get(
  '/dashboard/service-distribution',
  protect,
  adminOnly,
  getServiceDistribution
);


// GET /api/admin/dashboard/recent-leads
router.get(
  '/dashboard/recent-leads',
  protect,
  adminOnly,
  getDashboardRecentLeads
);


// GET /api/admin/dashboard/recent-registrations
router.get(
  '/dashboard/recent-registrations',
  protect,
  adminOnly,
  getDashboardRecentRegistrations
);


// GET /api/admin/dashboard/agent-performance
router.get(
  '/dashboard/agent-performance',
  protect,
  adminOnly,
  getAgentPerformanceSummary
);


// Existing dashboard endpoint
// GET /api/admin/dashboard
router.get(
  '/dashboard',
  protect,
  adminOnly,
  getDashboard
);


// ======================================================
// AGENT MANAGEMENT
// ======================================================

// GET /api/admin/agents
router.get(
  '/agents',
  protect,
  adminOnly,
  getAgents
);


// GET /api/admin/agents/:id
router.get(
  '/agents/:id',
  protect,
  adminOnly,
  getAgentById
);


// ======================================================
// ENQUIRY DASHBOARD
// ======================================================

// GET /api/admin/recent-enquiries
router.get(
  '/recent-enquiries',
  protect,
  adminOnly,
  getRecentEnquiries
);


// GET /api/admin/unassigned-enquiries
router.get(
  '/unassigned-enquiries',
  protect,
  adminOnly,
  getUnassignedEnquiries
);



// ======================================================
// CUSTOMERS
// ======================================================

// GET /api/admin/customers
router.get(
  "/customers",
  protect,
  adminOnly,
  getCustomers
);

// GET /api/admin/customers/:id
router.get(
  "/customers/:id",
  protect,
  adminOnly,
  getCustomerById
);


module.exports = router;