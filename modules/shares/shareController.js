const ShareLead = require('./shareModel');
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
| POST /api/shares
| Create share-specific lead details
|--------------------------------------------------------------------------
*/

const createShareLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      shareType,
      investmentAmount,
      investmentHorizon,
      riskPreference,
      preferredMarket,
      preferredSector,
      investmentGoal,
      dematStatus,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!shareType) {
      return errorResponse(
        res,
        'Share type is required',
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

    const amount = Number(investmentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return errorResponse(
        res,
        'Please enter a valid investment amount',
        400
      );
    }

    const access = await verifyEnquiryAccess(
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

    const existingLead = await ShareLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'Share details already exist for this enquiry',
        409
      );
    }

    const shareLead = await ShareLead.create({
      enquiryId,

      shareType: String(
        shareType
      ).trim(),

      investmentAmount: amount,

      investmentHorizon: String(
        investmentHorizon || ''
      ).trim(),

      riskPreference: String(
        riskPreference || ''
      ).trim(),

      preferredMarket: String(
        preferredMarket || ''
      ).trim(),

      preferredSector: String(
        preferredSector || ''
      ).trim(),

      investmentGoal: String(
        investmentGoal || ''
      ).trim(),

      dematStatus: String(
        dematStatus || ''
      ).trim(),

      additionalRequirements: String(
        additionalRequirements || ''
      ).trim(),

      status: 'NEW',
    });

    return successResponse(
      res,
      'Share details created successfully',
      shareLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/shares/:enquiryId
| Get share details
|--------------------------------------------------------------------------
*/

const getShareLead = async (req, res, next) => {
  try {
    const { enquiryId } = req.params;

    const access = await verifyEnquiryAccess(
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

    const shareLead = await ShareLead.findOne({
      enquiryId,
    }).lean();

    if (!shareLead) {
      return errorResponse(
        res,
        'Share details not found',
        404
      );
    }

    return successResponse(
      res,
      'Share details fetched successfully',
      shareLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/shares/:enquiryId
| Update share details
|--------------------------------------------------------------------------
*/

const updateShareLead = async (req, res, next) => {
  try {
    const { enquiryId } = req.params;

    const access = await verifyEnquiryAccess(
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

    const shareLead = await ShareLead.findOne({
      enquiryId,
    });

    if (!shareLead) {
      return errorResponse(
        res,
        'Share details not found',
        404
      );
    }

    const allowedFields = [
      'shareType',
      'investmentAmount',
      'investmentHorizon',
      'riskPreference',
      'preferredMarket',
      'preferredSector',
      'investmentGoal',
      'dematStatus',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shareLead[field] = req.body[field];
      }
    });

    if (
      req.body.investmentAmount !== undefined
    ) {
      const amount = Number(
        req.body.investmentAmount
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        return errorResponse(
          res,
          'Please enter a valid investment amount',
          400
        );
      }

      shareLead.investmentAmount = amount;
    }

    await shareLead.save();

    return successResponse(
      res,
      'Share details updated successfully',
      shareLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/shares/admin/all
| Admin: Get all share leads
|--------------------------------------------------------------------------
*/

const getAllShareLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      shareType,
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

    if (shareType) {
      filter.shareType =
        String(shareType).trim();
    }

    if (riskPreference) {
      filter.riskPreference =
        String(riskPreference).trim();
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [leads, total] =
      await Promise.all([
        ShareLead.find(filter)
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

        ShareLead.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'Share leads fetched successfully',
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
  createShareLead,
  getShareLead,
  updateShareLead,
  getAllShareLeads,
};