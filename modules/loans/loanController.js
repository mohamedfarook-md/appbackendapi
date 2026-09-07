const LoanLead = require('./loanModel');
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
| POST /api/loans
| Create loan-specific lead details
|--------------------------------------------------------------------------
*/

const createLoanLead = async (req, res, next) => {
  try {
    const {
      enquiryId,
      loanType,
      loanAmount,
      tenure,
      employmentType,
      monthlyIncome,
      monthlyObligations,
      existingLoans,
      preferredLender,
      purpose,
      additionalRequirements,
    } = req.body;

    if (!enquiryId) {
      return errorResponse(
        res,
        'Enquiry ID is required',
        400
      );
    }

    if (!loanType) {
      return errorResponse(
        res,
        'Loan type is required',
        400
      );
    }

    if (
      loanAmount === undefined ||
      loanAmount === null ||
      loanAmount === ''
    ) {
      return errorResponse(
        res,
        'Loan amount is required',
        400
      );
    }

    const amount = Number(loanAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return errorResponse(
        res,
        'Please enter a valid loan amount',
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

    const existingLead = await LoanLead.findOne({
      enquiryId,
    });

    if (existingLead) {
      return errorResponse(
        res,
        'Loan details already exist for this enquiry',
        409
      );
    }

    const loanLead = await LoanLead.create({
      enquiryId,

      loanType: String(
        loanType
      ).trim(),

      loanAmount: amount,

      tenure:
        tenure !== undefined &&
        tenure !== null &&
        tenure !== ''
          ? Number(tenure)
          : null,

      employmentType: String(
        employmentType || ''
      ).trim(),

      monthlyIncome:
        monthlyIncome !== undefined &&
        monthlyIncome !== null &&
        monthlyIncome !== ''
          ? Number(monthlyIncome)
          : null,

      monthlyObligations:
        monthlyObligations !== undefined &&
        monthlyObligations !== null &&
        monthlyObligations !== ''
          ? Number(monthlyObligations)
          : null,

      existingLoans: Boolean(existingLoans),

      preferredLender: String(
        preferredLender || ''
      ).trim(),

      purpose: String(
        purpose || ''
      ).trim(),

      additionalRequirements: String(
        additionalRequirements || ''
      ).trim(),

      status: 'NEW',
    });

    return successResponse(
      res,
      'Loan details created successfully',
      loanLead,
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/loans/:enquiryId
| Get loan details
|--------------------------------------------------------------------------
*/

const getLoanLead = async (req, res, next) => {
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

    const loanLead = await LoanLead.findOne({
      enquiryId,
    }).lean();

    if (!loanLead) {
      return errorResponse(
        res,
        'Loan details not found',
        404
      );
    }

    return successResponse(
      res,
      'Loan details fetched successfully',
      loanLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/loans/:enquiryId
| Update loan details
|--------------------------------------------------------------------------
*/

const updateLoanLead = async (req, res, next) => {
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

    const loanLead = await LoanLead.findOne({
      enquiryId,
    });

    if (!loanLead) {
      return errorResponse(
        res,
        'Loan details not found',
        404
      );
    }

    const allowedFields = [
      'loanType',
      'loanAmount',
      'tenure',
      'employmentType',
      'monthlyIncome',
      'monthlyObligations',
      'existingLoans',
      'preferredLender',
      'purpose',
      'additionalRequirements',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        loanLead[field] = req.body[field];
      }
    });

    if (req.body.loanAmount !== undefined) {
      const amount = Number(
        req.body.loanAmount
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        return errorResponse(
          res,
          'Please enter a valid loan amount',
          400
        );
      }

      loanLead.loanAmount = amount;
    }

    if (req.body.tenure !== undefined) {
      loanLead.tenure =
        req.body.tenure === '' ||
        req.body.tenure === null
          ? null
          : Number(req.body.tenure);
    }

    if (req.body.monthlyIncome !== undefined) {
      loanLead.monthlyIncome =
        req.body.monthlyIncome === '' ||
        req.body.monthlyIncome === null
          ? null
          : Number(req.body.monthlyIncome);
    }

    if (
      req.body.monthlyObligations !== undefined
    ) {
      loanLead.monthlyObligations =
        req.body.monthlyObligations === '' ||
        req.body.monthlyObligations === null
          ? null
          : Number(
              req.body.monthlyObligations
            );
    }

    await loanLead.save();

    return successResponse(
      res,
      'Loan details updated successfully',
      loanLead
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/loans/admin/all
| Admin: Get all loan leads
|--------------------------------------------------------------------------
*/

const getAllLoanLeads = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      loanType,
      employmentType,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (loanType) {
      filter.loanType =
        String(loanType).trim();
    }

    if (employmentType) {
      filter.employmentType =
        String(employmentType).trim();
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
        LoanLead.find(filter)
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

        LoanLead.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'Loan leads fetched successfully',
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
  createLoanLead,
  getLoanLead,
  updateLoanLead,
  getAllLoanLeads,
};