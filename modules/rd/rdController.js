const RDLead = require('./rdModel');
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
| POST /api/rd
| Create RD-specific lead details
|--------------------------------------------------------------------------
*/

const createRDLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      rdType,
      monthlyInvestment,
      tenure,
      preferredInstitution,
      paymentFrequency,
      maturityPreference,
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

    if (!rdType) {
      return errorResponse(
        res,
        'RD type is required',
        400
      );
    }

    if (
      monthlyInvestment === undefined ||
      monthlyInvestment === null ||
      monthlyInvestment === ''
    ) {
      return errorResponse(
        res,
        'Monthly investment is required',
        400
      );
    }

    const investment = Number(
      monthlyInvestment
    );

    if (
      !Number.isFinite(investment) ||
      investment <= 0
    ) {
      return errorResponse(
        res,
        'Please enter a valid monthly investment',
        400
      );
    }

    if (
      tenure === undefined ||
      tenure === null ||
      tenure === ''
    ) {
      return errorResponse(
        res,
        'Tenure is required',
        400
      );
    }

    const tenureValue = Number(tenure);

    if (
      !Number.isFinite(tenureValue) ||
      tenureValue <= 0
    ) {
      return errorResponse(
        res,
        'Please enter a valid tenure',
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

    const existingLead = await RDLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'RD details already exist for this enquiry',
        409
      );
    }

    const rdLead = await RDLead.create({
      enquiryId,

      rdType: String(
        rdType
      ).trim(),

      monthlyInvestment: investment,

      tenure: tenureValue,

      preferredInstitution: String(
        preferredInstitution || ''
      ).trim(),

      paymentFrequency: String(
        paymentFrequency || 'Monthly'
      ).trim(),

      maturityPreference: String(
        maturityPreference || ''
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
      'RD details created successfully',
      rdLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/rd/:enquiryId
| Get RD details
|--------------------------------------------------------------------------
*/

const getRDLead = async (req, res, next) => {
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

    const rdLead = await RDLead.findOne({
      enquiryId,
    }).lean();

    if (!rdLead) {
      return errorResponse(
        res,
        'RD details not found',
        404
      );
    }

    return successResponse(
      res,
      'RD details fetched successfully',
      rdLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/rd/:enquiryId
| Update RD details
|--------------------------------------------------------------------------
*/

const updateRDLead = async (req, res, next) => {
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

    const rdLead = await RDLead.findOne({
      enquiryId,
    });

    if (!rdLead) {
      return errorResponse(
        res,
        'RD details not found',
        404
      );
    }

    const allowedFields = [
      'rdType',
      'monthlyInvestment',
      'tenure',
      'preferredInstitution',
      'paymentFrequency',
      'maturityPreference',
      'investmentPurpose',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        rdLead[field] = req.body[field];
      }
    });

    if (
      req.body.monthlyInvestment !== undefined
    ) {
      const investment = Number(
        req.body.monthlyInvestment
      );

      if (
        !Number.isFinite(investment) ||
        investment <= 0
      ) {
        return errorResponse(
          res,
          'Please enter a valid monthly investment',
          400
        );
      }

      rdLead.monthlyInvestment =
        investment;
    }

    if (req.body.tenure !== undefined) {
      const tenureValue = Number(
        req.body.tenure
      );

      if (
        !Number.isFinite(tenureValue) ||
        tenureValue <= 0
      ) {
        return errorResponse(
          res,
          'Please enter a valid tenure',
          400
        );
      }

      rdLead.tenure = tenureValue;
    }

    await rdLead.save();

    return successResponse(
      res,
      'RD details updated successfully',
      rdLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/rd/admin/all
| Admin: Get all RD leads
|--------------------------------------------------------------------------
*/

const getAllRDLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      rdType,
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

    if (rdType) {
      filter.rdType =
        String(rdType).trim();
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
        RDLead.find(filter)
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

        RDLead.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'RD leads fetched successfully',
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
  createRDLead,
  getRDLead,
  updateRDLead,
  getAllRDLeads,
};