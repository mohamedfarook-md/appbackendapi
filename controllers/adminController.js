const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

const {
  successResponse,
  errorResponse,
} = require('../utils/response');


// ======================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/admin/dashboard/summary
// ======================================================

const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();

    // --------------------------------------------------
    // Today
    // --------------------------------------------------

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // --------------------------------------------------
    // Last 30 days
    // --------------------------------------------------

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --------------------------------------------------
    // Customer statistics
    // --------------------------------------------------

    const [
      totalCustomers,
      verifiedUsers,
      activeUsers,
      newUsersToday,

      totalLeads,
      newLeadsToday,

      pendingLeads,
      appQrLeads,
    ] = await Promise.all([

      User.countDocuments({
        role: 'customer',
      }),

      User.countDocuments({
        role: 'customer',
        isVerified: true,
      }),

      User.countDocuments({
        role: 'customer',
        lastLoginAt: {
          $gte: thirtyDaysAgo,
        },
      }),

      User.countDocuments({
        role: 'customer',
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),

      Enquiry.countDocuments(),

      Enquiry.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),

      Enquiry.countDocuments({
        status: {
          $in: [
            'NEW',
            'CONTACTED',
            'IN_PROGRESS',
            'DOCUMENT_PENDING',
            'SUBMITTED',
          ],
        },
      }),

      // Current Enquiry model does NOT contain APP_QR.
      // Therefore we do not fabricate a QR number.
      Enquiry.countDocuments({
        source: 'Mobile App QR',
      }),
    ]);


    return successResponse(
      res,
      'Dashboard summary fetched successfully',
      {
        totalCustomers,
        verifiedUsers,
        activeUsers,
        newUsersToday,

        totalLeads,
        newLeadsToday,
        pendingLeads,

        appQrLeads,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// REGISTRATION TREND
// GET /api/admin/dashboard/registration-trend
// ======================================================

const getRegistrationTrend = async (req, res, next) => {
  try {
    const days = 30;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const trend = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);


    // --------------------------------------------------
    // Fill missing dates with 0
    // --------------------------------------------------

    const result = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString =
        date.toISOString().split('T')[0];

      const found = trend.find(
        (item) => item._id === dateString
      );

      result.push({
        date: dateString,
        count: found ? found.count : 0,
      });
    }


    return successResponse(
      res,
      'Registration trend fetched successfully',
      result
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// SERVICE DISTRIBUTION
// GET /api/admin/dashboard/service-distribution
// ======================================================

const getServiceDistribution = async (
  req,
  res,
  next
) => {
  try {
    const distribution = await Enquiry.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);


    const result = distribution
      .filter((item) => item._id)
      .map((item) => ({
        service: item._id,
        count: item.count,
      }));


    return successResponse(
      res,
      'Service distribution fetched successfully',
      result
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// RECENT LEADS
// GET /api/admin/dashboard/recent-leads
// ======================================================

const getDashboardRecentLeads = async (
  req,
  res,
  next
) => {
  try {
    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 8,
        1
      ),
      50
    );


    const enquiries = await Enquiry
      .find({})
      .populate(
        'customerId',
        'name mobile email'
      )
      .populate(
        'assignedAgent',
        'name mobile email'
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();


    const items = enquiries.map((lead) => ({
      id: lead._id,

      leadId:
        lead.enquiryId ||
        String(lead._id),

      customerName:
        lead.customerDetails?.fullName ||
        lead.customerId?.name ||
        '—',

      customer: lead.customerId
        ? {
            name: lead.customerId.name,
            mobile: lead.customerId.mobile,
            email: lead.customerId.email,
          }
        : null,

      service:
        lead.serviceType || '—',

      status:
        lead.status || 'NEW',

      createdAt:
        lead.createdAt,

      assignedAgent:
        lead.assignedAgent
          ? {
              id: lead.assignedAgent._id,
              name: lead.assignedAgent.name,
              mobile: lead.assignedAgent.mobile,
              email: lead.assignedAgent.email,
            }
          : null,
    }));


    return successResponse(
      res,
      'Recent leads fetched successfully',
      {
        items,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// RECENT REGISTRATIONS
// GET /api/admin/dashboard/recent-registrations
// ======================================================

const getDashboardRecentRegistrations = async (
  req,
  res,
  next
) => {
  try {
    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 8,
        1
      ),
      50
    );


    const customers = await User
      .find({
        role: 'customer',
      })
      .select(
        'name mobile email createdAt'
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();


    const items = customers.map((customer) => ({
      id: customer._id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      registeredAt: customer.createdAt,
      createdAt: customer.createdAt,
    }));


    return successResponse(
      res,
      'Recent registrations fetched successfully',
      {
        items,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// AGENT PERFORMANCE
// GET /api/admin/dashboard/agent-performance
// ======================================================

const getAgentPerformanceSummary = async (
  req,
  res,
  next
) => {
  try {
    const agents = await User
      .find({
        role: 'agent',
        isActive: true,
      })
      .select(
        'name mobile email role isActive'
      )
      .sort({
        name: 1,
      })
      .lean();


    const performance = await Promise.all(
      agents.map(async (agent) => {

        const [
          assigned,
          pending,
          completed,
        ] = await Promise.all([

          Enquiry.countDocuments({
            assignedAgent: agent._id,
          }),

          Enquiry.countDocuments({
            assignedAgent: agent._id,
            status: {
              $in: [
                'NEW',
                'CONTACTED',
                'IN_PROGRESS',
                'DOCUMENT_PENDING',
                'SUBMITTED',
              ],
            },
          }),

          Enquiry.countDocuments({
            assignedAgent: agent._id,
            status: {
              $in: [
                'APPROVED',
                'CLOSED',
              ],
            },
          }),
        ]);


        return {
          agentId: agent._id,
          id: agent._id,

          name: agent.name,

          assigned,
          pending,
          completed,

          status: agent.isActive
            ? 'ACTIVE'
            : 'INACTIVE',
        };
      })
    );


    return successResponse(
      res,
      'Agent performance fetched successfully',
      performance
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// EXISTING ADMIN DASHBOARD
// GET /api/admin/dashboard
// ======================================================

const getDashboard = async (req, res, next) => {
  try {

    const [
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      inProgressEnquiries,
      documentPendingEnquiries,
      submittedEnquiries,
      approvedEnquiries,
      rejectedEnquiries,
      closedEnquiries,
    ] = await Promise.all([

      Enquiry.countDocuments(),

      Enquiry.countDocuments({
        status: 'NEW',
      }),

      Enquiry.countDocuments({
        status: 'CONTACTED',
      }),

      Enquiry.countDocuments({
        status: 'IN_PROGRESS',
      }),

      Enquiry.countDocuments({
        status: 'DOCUMENT_PENDING',
      }),

      Enquiry.countDocuments({
        status: 'SUBMITTED',
      }),

      Enquiry.countDocuments({
        status: 'APPROVED',
      }),

      Enquiry.countDocuments({
        status: 'REJECTED',
      }),

      Enquiry.countDocuments({
        status: 'CLOSED',
      }),
    ]);


    const serviceWise =
      await Enquiry.aggregate([
        {
          $group: {
            _id: '$serviceType',
            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);


    const startOfToday = new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );


    const endOfToday = new Date();

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );


    const todayEnquiries =
      await Enquiry.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      });


    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );


    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );


    const monthlyEnquiries =
      await Enquiry.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });


    return successResponse(
      res,
      'Dashboard data fetched successfully',
      {
        summary: {
          total: totalEnquiries,
          today: todayEnquiries,
          thisMonth: monthlyEnquiries,
        },

        status: {
          NEW: newEnquiries,
          CONTACTED: contactedEnquiries,
          IN_PROGRESS: inProgressEnquiries,
          DOCUMENT_PENDING:
            documentPendingEnquiries,
          SUBMITTED: submittedEnquiries,
          APPROVED: approvedEnquiries,
          REJECTED: rejectedEnquiries,
          CLOSED: closedEnquiries,
        },

        serviceWise: serviceWise.map(
          (item) => ({
            serviceType: item._id,
            count: item.count,
          })
        ),
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET ALL AGENTS
// GET /api/admin/agents
// ======================================================

const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({
      role: 'agent',
      isActive: true,
    })
      .select(
        'name mobile email role isActive createdAt'
      )
      .sort({
        name: 1,
      })
      .lean();


    return successResponse(
      res,
      'Agents fetched successfully',
      {
        agents,
        total: agents.length,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET AGENT DETAILS
// GET /api/admin/agents/:id
// ======================================================

const getAgentById = async (
  req,
  res,
  next
) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      role: 'agent',
    })
      .select(
        'name mobile email role isActive createdAt lastLoginAt'
      )
      .lean();


    if (!agent) {
      return errorResponse(
        res,
        'Agent not found',
        404
      );
    }


    const [
      total,
      newCount,
      inProgress,
      approved,
      rejected,
      closed,
    ] = await Promise.all([

      Enquiry.countDocuments({
        assignedAgent: agent._id,
      }),

      Enquiry.countDocuments({
        assignedAgent: agent._id,
        status: 'NEW',
      }),

      Enquiry.countDocuments({
        assignedAgent: agent._id,
        status: 'IN_PROGRESS',
      }),

      Enquiry.countDocuments({
        assignedAgent: agent._id,
        status: 'APPROVED',
      }),

      Enquiry.countDocuments({
        assignedAgent: agent._id,
        status: 'REJECTED',
      }),

      Enquiry.countDocuments({
        assignedAgent: agent._id,
        status: 'CLOSED',
      }),
    ]);


    return successResponse(
      res,
      'Agent details fetched successfully',
      {
        agent,
        statistics: {
          total,
          NEW: newCount,
          IN_PROGRESS: inProgress,
          APPROVED: approved,
          REJECTED: rejected,
          CLOSED: closed,
        },
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET RECENT ENQUIRIES
// GET /api/admin/recent-enquiries
// ======================================================

const getRecentEnquiries = async (
  req,
  res,
  next
) => {
  try {
    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1
      ),
      50
    );


    const enquiries =
      await Enquiry.find({})
        .populate(
          'customerId',
          'name mobile email'
        )
        .populate(
          'assignedAgent',
          'name mobile email'
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();


    return successResponse(
      res,
      'Recent enquiries fetched successfully',
      {
        enquiries,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// GET UNASSIGNED ENQUIRIES
// GET /api/admin/unassigned-enquiries
// ======================================================

const getUnassignedEnquiries = async (
  req,
  res,
  next
) => {
  try {
    const enquiries =
      await Enquiry.find({
        assignedAgent: null,
      })
        .sort({
          createdAt: -1,
        })
        .lean();


    return successResponse(
      res,
      'Unassigned enquiries fetched successfully',
      {
        enquiries,
        total: enquiries.length,
      }
    );

  } catch (error) {
    next(error);
  }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  // New dashboard APIs
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
};