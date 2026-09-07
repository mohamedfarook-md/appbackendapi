const InsuranceRenewalLead = require('./renewalModel');
const Enquiry = require('../../models/Enquiry');

const {
  successResponse,
  errorResponse,
} = require('../../utils/response');

/**
 * POST /api/insurance-renewal
 * Create insurance renewal-specific lead details
 */
const createRenewalLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      existingInsurer,
      policyNumber,
      policyType,
      policyStartDate,
      policyExpiryDate,
      sumInsured,
      currentPremium,
      renewalRequirement,
      preferredInsurer,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!existingInsurer) {
      return errorResponse(
        res,
        'Existing insurer is required',
        400
      );
    }

    if (!policyNumber) {
      return errorResponse(
        res,
        'Policy number is required',
        400
      );
    }

    if (!policyExpiryDate) {
      return errorResponse(
        res,
        'Policy expiry date is required',
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

    // Customer can access only their own enquiry
    if (
      req.user &&
      req.user.role === 'customer' &&
      enquiry.customerId.toString() !==
        req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const existingLead =
      await InsuranceRenewalLead.findOne({
        enquiryId,
      });

    if (existingLead) {
      return errorResponse(
        res,
        'Insurance renewal details already exist for this enquiry',
        409
      );
    }

    const renewalLead =
      await InsuranceRenewalLead.create({
        enquiryId,

        existingInsurer: String(
          existingInsurer
        ).trim(),

        policyNumber: String(
          policyNumber
        )
          .trim()
          .toUpperCase(),

        policyType: String(
          policyType || ''
        ).trim(),

        policyStartDate: String(
          policyStartDate || ''
        ).trim(),

        policyExpiryDate: String(
          policyExpiryDate
        ).trim(),

        sumInsured:
          sumInsured !== undefined &&
          sumInsured !== null &&
          sumInsured !== ''
            ? Number(sumInsured)
            : null,

        currentPremium:
          currentPremium !== undefined &&
          currentPremium !== null &&
          currentPremium !== ''
            ? Number(currentPremium)
            : null,

        renewalRequirement: String(
          renewalRequirement || ''
        ).trim(),

        preferredInsurer: String(
          preferredInsurer || ''
        ).trim(),

        additionalRequirements: String(
          additionalRequirements || ''
        ).trim(),

        status: 'NEW',
      });

    return successResponse(
      res,
      'Insurance renewal details created successfully',
      renewalLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insurance-renewal/:enquiryId
 * Get renewal details for an enquiry
 */
const getRenewalLead = async (req, res, next) => {
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
      enquiry.customerId.toString() !==
        req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const renewalLead =
      await InsuranceRenewalLead.findOne({
        enquiryId,
      }).lean();

    if (!renewalLead) {
      return errorResponse(
        res,
        'Insurance renewal details not found',
        404
      );
    }

    return successResponse(
      res,
      'Insurance renewal details fetched successfully',
      renewalLead
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/insurance-renewal/:enquiryId
 * Update renewal-specific details
 */
const updateRenewalLead = async (req, res, next) => {
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
      enquiry.customerId.toString() !==
        req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'You are not authorized to access this enquiry',
        403
      );
    }

    const renewalLead =
      await InsuranceRenewalLead.findOne({
        enquiryId,
      });

    if (!renewalLead) {
      return errorResponse(
        res,
        'Insurance renewal details not found',
        404
      );
    }

    const allowedFields = [
      'existingInsurer',
      'policyNumber',
      'policyType',
      'policyStartDate',
      'policyExpiryDate',
      'sumInsured',
      'currentPremium',
      'renewalRequirement',
      'preferredInsurer',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        renewalLead[field] = req.body[field];
      }
    });

    if (req.body.policyNumber !== undefined) {
      renewalLead.policyNumber = String(
        req.body.policyNumber
      )
        .trim()
        .toUpperCase();
    }

    await renewalLead.save();

    return successResponse(
      res,
      'Insurance renewal details updated successfully',
      renewalLead
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insurance-renewal/admin/all
 * Admin: Get all renewal leads
 */
const getAllRenewalLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      existingInsurer,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (existingInsurer) {
      filter.existingInsurer =
        String(existingInsurer).trim();
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
      InsuranceRenewalLead.find(filter)
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

      InsuranceRenewalLead.countDocuments(
        filter
      ),
    ]);

    return successResponse(
      res,
      'Insurance renewal leads fetched successfully',
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
  createRenewalLead,
  getRenewalLead,
  updateRenewalLead,
  getAllRenewalLeads,
};