const InsuranceLead = require('./insuranceModel');
const Enquiry = require('../../models/Enquiry');
const {
  successResponse,
  errorResponse,
} = require('../../utils/response');

/**
 * POST /api/insurance
 * Create insurance-specific lead details
 */
const createInsuranceLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      insuranceType,
      insuranceRequirement,
      preferredInsurer,
      coverageAmount,
      policyTerm,
      premiumBudget,
      existingPolicy,
      existingPolicyNumber,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!insuranceType) {
      return errorResponse(
        res,
        'Insurance type is required',
        400
      );
    }

    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    // Customer can only create details for their own enquiry
    if (
      req.user &&
      req.user.role === 'customer' &&
      enquiry.customerId.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const existingLead = await InsuranceLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'Insurance details already exist for this enquiry',
        409
      );
    }

    const insuranceLead = await InsuranceLead.create({
      enquiryId,
      insuranceType: String(insuranceType).trim(),
      insuranceRequirement: String(
        insuranceRequirement || ''
      ).trim(),
      preferredInsurer: String(
        preferredInsurer || ''
      ).trim(),

      coverageAmount:
        coverageAmount !== undefined &&
        coverageAmount !== null &&
        coverageAmount !== ''
          ? Number(coverageAmount)
          : null,

      policyTerm:
        policyTerm !== undefined &&
        policyTerm !== null &&
        policyTerm !== ''
          ? Number(policyTerm)
          : null,

      premiumBudget:
        premiumBudget !== undefined &&
        premiumBudget !== null &&
        premiumBudget !== ''
          ? Number(premiumBudget)
          : null,

      existingPolicy: Boolean(existingPolicy),

      existingPolicyNumber: String(
        existingPolicyNumber || ''
      ).trim(),

      additionalRequirements: String(
        additionalRequirements || ''
      ).trim(),

      status: 'NEW',
    });

    return successResponse(
      res,
      'Insurance details created successfully',
      insuranceLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insurance/:enquiryId
 * Get insurance details for an enquiry
 */
const getInsuranceLead = async (req, res, next) => {
  try {
    const { enquiryId } = req.params;

    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    if (
      req.user &&
      req.user.role === 'customer' &&
      enquiry.customerId.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const insuranceLead = await InsuranceLead.findOne({
      enquiryId,
    }).lean();

    if (!insuranceLead) {
      return errorResponse(
        res,
        'Insurance details not found',
        404
      );
    }

    return successResponse(
      res,
      'Insurance details fetched successfully',
      insuranceLead
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/insurance/:enquiryId
 * Update insurance-specific details
 */
const updateInsuranceLead = async (req, res, next) => {
  try {
    const { enquiryId } = req.params;

    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    if (
      req.user &&
      req.user.role === 'customer' &&
      enquiry.customerId.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const insuranceLead = await InsuranceLead.findOne({
      enquiryId,
    });

    if (!insuranceLead) {
      return errorResponse(
        res,
        'Insurance details not found',
        404
      );
    }

    const allowedFields = [
      'insuranceType',
      'insuranceRequirement',
      'preferredInsurer',
      'coverageAmount',
      'policyTerm',
      'premiumBudget',
      'existingPolicy',
      'existingPolicyNumber',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        insuranceLead[field] = req.body[field];
      }
    });

    await insuranceLead.save();

    return successResponse(
      res,
      'Insurance details updated successfully',
      insuranceLead
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insurance
 * Admin: Get all insurance leads
 */
const getAllInsuranceLeads = async (req, res, next) => {
  try {
    const {
      status,
      insuranceType,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status).trim().toUpperCase();
    }

    if (insuranceType) {
      filter.insuranceType = String(
        insuranceType
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
      (pageNumber - 1) * limitNumber;

    const [leads, total] = await Promise.all([
      InsuranceLead.find(filter)
        .populate({
          path: 'enquiryId',
          populate: {
            path: 'customerId',
            select: 'name mobile email',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      InsuranceLead.countDocuments(filter),
    ]);

    return successResponse(
      res,
      'Insurance leads fetched successfully',
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
  createInsuranceLead,
  getInsuranceLead,
  updateInsuranceLead,
  getAllInsuranceLeads,
};