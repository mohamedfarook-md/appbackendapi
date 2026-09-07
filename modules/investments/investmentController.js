const InvestmentLead = require('./investmentModel');
const Enquiry = require('../../models/Enquiry');

const {
  successResponse,
  errorResponse,
} = require('../../utils/response');

/*
|--------------------------------------------------------------------------
| Customer Authorization Helper
|--------------------------------------------------------------------------
*/

const verifyEnquiryAccess = async (enquiryId, user) => {
  const enquiry = await Enquiry.findById(enquiryId);

  if (!enquiry) {
    return {
      error: 'Enquiry not found',
      statusCode: 404,
    };
  }

  if (
    user &&
    user.role === 'customer' &&
    enquiry.customerId.toString() !==
      user._id.toString()
  ) {
    return {
      error:
        'You are not authorized to access this enquiry',
      statusCode: 403,
    };
  }

  return { enquiry };
};

/*
|--------------------------------------------------------------------------
| POST /api/investments
| Create investment-specific lead details
|--------------------------------------------------------------------------
*/

const createInvestmentLead = async (
  req,
  res,
  next
) => {
  try {
    const {
      enquiryId,
      investmentType,
      investmentAmount,
      investmentHorizon,
      investmentGoal,
      riskPreference,
      preferredPlatform,
      expectedReturn,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!investmentType) {
      return errorResponse(
        res,
        'Investment type is required',
        400
      );
    }

    if (
      investmentAmount === undefined ||
      investmentAmount === null ||
      investmentAmount === ''
    ) {
      return errorResponse(
        res,
        'Investment amount is required',
        400
      );
    }

    const amount = Number(
      investmentAmount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return errorResponse(
        res,
        'Please enter a valid investment amount',
        400
      );
    }

    const access =
      await verifyEnquiryAccess(
        enquiryId,
        req.user
      );

    if (access.error) {
      return errorResponse(
        res,
        access.error,
        access.statusCode
      );
    }

    const existingLead =
      await InvestmentLead.findOne({
        enquiryId,
      });

    if (existingLead) {
      return errorResponse(
        res,
        'Investment details already exist for this enquiry',
        409
      );
    }

    const investmentLead =
      await InvestmentLead.create({
        enquiryId,

        investmentType: String(
          investmentType
        ).trim(),

        investmentAmount: amount,

        investmentHorizon: String(
          investmentHorizon || ''
        ).trim(),

        investmentGoal: String(
          investmentGoal || ''
        ).trim(),

        riskPreference: String(
          riskPreference || ''
        ).trim(),

        preferredPlatform: String(
          preferredPlatform || ''
        ).trim(),

        expectedReturn:
          expectedReturn !== undefined &&
          expectedReturn !== null &&
          expectedReturn !== ''
            ? Number(expectedReturn)
            : null,

        additionalRequirements: String(
          additionalRequirements || ''
        ).trim(),

        status: 'NEW',
      });

    return successResponse(
      res,
      'Investment details created successfully',
      investmentLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/investments/:enquiryId
| Get investment details
|--------------------------------------------------------------------------
*/

const getInvestmentLead = async (
  req,
  res,
  next
) => {
  try {
    const { enquiryId } = req.params;

    const access =
      await verifyEnquiryAccess(
        enquiryId,
        req.user
      );

    if (access.error) {
      return errorResponse(
        res,
        access.error,
        access.statusCode
      );
    }

    const investmentLead =
      await InvestmentLead.findOne({
        enquiryId,
      }).lean();

    if (!investmentLead) {
      return errorResponse(
        res,
        'Investment details not found',
        404
      );
    }

    return successResponse(
      res,
      'Investment details fetched successfully',
      investmentLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/investments/:enquiryId
| Update investment details
|--------------------------------------------------------------------------
*/

const updateInvestmentLead = async (
  req,
  res,
  next
) => {
  try {
    const { enquiryId } = req.params;

    const access =
      await verifyEnquiryAccess(
        enquiryId,
        req.user
      );

    if (access.error) {
      return errorResponse(
        res,
        access.error,
        access.statusCode
      );
    }

    const investmentLead =
      await InvestmentLead.findOne({
        enquiryId,
      });

    if (!investmentLead) {
      return errorResponse(
        res,
        'Investment details not found',
        404
      );
    }

    const allowedFields = [
      'investmentType',
      'investmentAmount',
      'investmentHorizon',
      'investmentGoal',
      'riskPreference',
      'preferredPlatform',
      'expectedReturn',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        investmentLead[field] =
          req.body[field];
      }
    });

    if (
      req.body.investmentAmount !==
      undefined
    ) {
      const amount = Number(
        req.body.investmentAmount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return errorResponse(
          res,
          'Please enter a valid investment amount',
          400
        );
      }

      investmentLead.investmentAmount =
        amount;
    }

    if (
      req.body.expectedReturn !==
      undefined
    ) {
      investmentLead.expectedReturn =
        req.body.expectedReturn === '' ||
        req.body.expectedReturn === null
          ? null
          : Number(
              req.body.expectedReturn
            );
    }

    await investmentLead.save();

    return successResponse(
      res,
      'Investment details updated successfully',
      investmentLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/investments/admin/all
| Admin: Get all investment leads
|--------------------------------------------------------------------------
*/

const getAllInvestmentLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      investmentType,
      riskPreference,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (investmentType) {
      filter.investmentType =
        String(
          investmentType
        ).trim();
    }

    if (riskPreference) {
      filter.riskPreference =
        String(
          riskPreference
        ).trim();
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [leads, total] =
      await Promise.all([
        InvestmentLead.find(filter)
          .populate({
            path: 'enquiryId',
            populate: {
              path: 'customerId',
              select:
                'name mobile email',
            },
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        InvestmentLead.countDocuments(
          filter
        ),
      ]);

    return successResponse(
      res,
      'Investment leads fetched successfully',
      {
        leads,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(
            total / limitNumber
          ),
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvestmentLead,
  getInvestmentLead,
  updateInvestmentLead,
  getAllInvestmentLeads,
};