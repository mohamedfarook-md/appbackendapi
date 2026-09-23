const express = require('express');

const {
  // Dashboard APIs
  createCompany,
  getCompanies,
  getCompanyById,
  createCompanyAgent,
  getCompanyAgents,
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
exportNewLeads,
} = require('../controllers/adminController');

const {
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  assignEnquiryAgent,
} = require('../controllers/enquiryController');

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
// COMPANY MANAGEMENT
// ======================================================

// GET /api/admin/companies
router.get(
  '/companies',
  protect,
  adminOnly,
  getCompanies
);


// GET /api/admin/companies/:id
router.get(
  '/companies/:id',
  protect,
  adminOnly,
  getCompanyById
);

// POST /api/admin/companies
router.post(
  '/companies',
  protect,
  adminOnly,
  createCompany
);



router.post(
  '/companies/:companyId/agents',
  protect,
  adminOnly,
  createCompanyAgent
);



router.get(
  '/companies/:companyId/agents',
  protect,
  adminOnly,
  getCompanyAgents
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
// LEADS
// ======================================================




// GET /api/admin/leads/export
router.get(
  '/leads/export',
  protect,
  adminOnly,
  exportNewLeads
);



// GET /api/admin/leads
router.get(
  '/leads',
  protect,
  adminOnly,
  getAllEnquiries
);

// GET /api/admin/leads/:id
router.get(
  '/leads/:id',
  protect,
  adminOnly,
  getEnquiryById
);

// PATCH /api/admin/leads/:id/status
router.patch(
  '/leads/:id/status',
  protect,
  adminOnly,
  updateEnquiryStatus
);

// PATCH /api/admin/leads/:id/assign
router.patch(
  '/leads/:id/assign',
  protect,
  adminOnly,
  assignEnquiryAgent
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