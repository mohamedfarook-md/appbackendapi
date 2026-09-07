const BondLead = require('./bondModel');
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
| POST /api/bonds
| Create bond-specific lead details
|--------------------------------------------------------------------------
*/

const createBondLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      bondType,
      investmentAmount,
      investmentTenure,
      preferredIssuer,
      expectedReturn,
      interestPayoutPreference,
      investmentPurpose,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!bondType) {
      return errorResponse(
        res,
        'Bond type is required',
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

    const existingLead = await BondLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'Bond details already exist for this enquiry',
        409
      );
    }

    const bondLead = await BondLead.create({
      enquiryId,

      bondType: String(
        bondType
      ).trim(),

      investmentAmount: amount,

      investmentTenure:
        investmentTenure !== undefined &&
        investmentTenure !== null &&
        investmentTenure !== ''
          ? Number(investmentTenure)
          : null,

      preferredIssuer: String(
        preferredIssuer || ''
      ).trim(),

      expectedReturn:
        expectedReturn !== undefined &&
        expectedReturn !== null &&
        expectedReturn !== ''
          ? Number(expectedReturn)
          : null,

      interestPayoutPreference: String(
        interestPayoutPreference || ''
      ).trim(),

      investmentPurpose: String(
        investmentPurpose || ''
      ).trim(),

      additionalRequirements: String(
        additionalRequirements || ''
      ).trim(),

      status: 'NEW',
    });

    return successResponse(
      res,
      'Bond details created successfully',
      bondLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/bonds/:enquiryId
| Get bond details
|--------------------------------------------------------------------------
*/

const getBondLead = async (req, res, next) => {
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

    const bondLead = await BondLead.findOne({
      enquiryId,
    }).lean();

    if (!bondLead) {
      return errorResponse(
        res,
        'Bond details not found',
        404
      );
    }

    return successResponse(
      res,
      'Bond details fetched successfully',
      bondLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/bonds/:enquiryId
| Update bond details
|--------------------------------------------------------------------------
*/

const updateBondLead = async (req, res, next) => {
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

    const bondLead = await BondLead.findOne({
      enquiryId,
    });

    if (!bondLead) {
      return errorResponse(
        res,
        'Bond details not found',
        404
      );
    }

    const allowedFields = [
      'bondType',
      'investmentAmount',
      'investmentTenure',
      'preferredIssuer',
      'expectedReturn',
      'interestPayoutPreference',
      'investmentPurpose',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        bondLead[field] = req.body[field];
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

      bondLead.investmentAmount = amount;
    }

    if (
      req.body.investmentTenure !== undefined
    ) {
      bondLead.investmentTenure =
        req.body.investmentTenure === '' ||
        req.body.investmentTenure === null
          ? null
          : Number(
              req.body.investmentTenure
            );
    }

    if (
      req.body.expectedReturn !== undefined
    ) {
      bondLead.expectedReturn =
        req.body.expectedReturn === '' ||
        req.body.expectedReturn === null
          ? null
          : Number(
              req.body.expectedReturn
            );
    }

    await bondLead.save();

    return successResponse(
      res,
      'Bond details updated successfully',
      bondLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/bonds/admin/all
| Admin: Get all bond leads
|--------------------------------------------------------------------------
*/

const getAllBondLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      bondType,
      preferredIssuer,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (bondType) {
      filter.bondType =
        String(bondType).trim();
    }

    if (preferredIssuer) {
      filter.preferredIssuer =
        String(
          preferredIssuer
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
        BondLead.find(filter)
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

        BondLead.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'Bond leads fetched successfully',
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
  createBondLead,
  getBondLead,
  updateBondLead,
  getAllBondLeads,
};