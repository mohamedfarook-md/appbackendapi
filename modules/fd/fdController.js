const FDLead = require('./fdModel');
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
| POST /api/fd
| Create FD-specific lead details
|--------------------------------------------------------------------------
*/

const createFDLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      fdType,
      investmentAmount,
      tenure,
      preferredInstitution,
      payoutPreference,
      interestPayoutFrequency,
      maturityPreference,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!fdType) {
      return errorResponse(
        res,
        'FD type is required',
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

    const existingLead = await FDLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'FD details already exist for this enquiry',
        409
      );
    }

    const fdLead = await FDLead.create({
      enquiryId,

      fdType: String(fdType).trim(),

      investmentAmount: amount,

      tenure:
        tenure !== undefined &&
        tenure !== null &&
        tenure !== ''
          ? Number(tenure)
          : null,

      preferredInstitution: String(
        preferredInstitution || ''
      ).trim(),

      payoutPreference: String(
        payoutPreference || ''
      ).trim(),

      interestPayoutFrequency: String(
        interestPayoutFrequency || ''
      ).trim(),

      maturityPreference: String(
        maturityPreference || ''
      ).trim(),

      additionalRequirements: String(
        additionalRequirements || ''
      ).trim(),

      status: 'NEW',
    });

    return successResponse(
      res,
      'FD details created successfully',
      fdLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/fd/:enquiryId
| Get FD details
|--------------------------------------------------------------------------
*/

const getFDLead = async (req, res, next) => {
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

    const fdLead = await FDLead.findOne({
      enquiryId,
    }).lean();

    if (!fdLead) {
      return errorResponse(
        res,
        'FD details not found',
        404
      );
    }

    return successResponse(
      res,
      'FD details fetched successfully',
      fdLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/fd/:enquiryId
| Update FD details
|--------------------------------------------------------------------------
*/

const updateFDLead = async (req, res, next) => {
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

    const fdLead = await FDLead.findOne({
      enquiryId,
    });

    if (!fdLead) {
      return errorResponse(
        res,
        'FD details not found',
        404
      );
    }

    const allowedFields = [
      'fdType',
      'investmentAmount',
      'tenure',
      'preferredInstitution',
      'payoutPreference',
      'interestPayoutFrequency',
      'maturityPreference',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fdLead[field] = req.body[field];
      }
    });

    if (req.body.investmentAmount !== undefined) {
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

      fdLead.investmentAmount = amount;
    }

    if (req.body.tenure !== undefined) {
      fdLead.tenure =
        req.body.tenure === '' ||
        req.body.tenure === null
          ? null
          : Number(req.body.tenure);
    }

    await fdLead.save();

    return successResponse(
      res,
      'FD details updated successfully',
      fdLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/fd/admin/all
| Admin: Get all FD leads
|--------------------------------------------------------------------------
*/

const getAllFDLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      fdType,
      preferredInstitution,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (fdType) {
      filter.fdType = String(fdType).trim();
    }

    if (preferredInstitution) {
      filter.preferredInstitution =
        String(
          preferredInstitution
        ).trim();
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
        FDLead.find(filter)
          .populate({
            path: 'enquiryId',
            populate: {
              path: 'customerId',
              select:
                'name mobile email',
            },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        FDLead.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'FD leads fetched successfully',
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
  createFDLead,
  getFDLead,
  updateFDLead,
  getAllFDLeads,
};