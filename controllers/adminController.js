const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

const {
  successResponse,
  errorResponse,
} = require('../utils/response');


// ======================================================
// ADMIN DASHBOARD
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


    // --------------------------------------------------
    // Service-wise enquiry count
    // --------------------------------------------------

    const serviceWise = await Enquiry.aggregate([
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


    // --------------------------------------------------
    // Today's enquiries
    // --------------------------------------------------

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


    // --------------------------------------------------
    // This month's enquiries
    // --------------------------------------------------

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


    // --------------------------------------------------
    // Response
    // --------------------------------------------------

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


    // --------------------------------------------------
    // Agent enquiry statistics
    // --------------------------------------------------

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
  getDashboard,
  getAgents,
  getAgentById,
  getRecentEnquiries,
  getUnassignedEnquiries,
};