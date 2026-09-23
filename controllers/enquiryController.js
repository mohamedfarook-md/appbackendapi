const Enquiry = require('../models/Enquiry');

const User = require('../models/User');

const {
  sendPushNotification,
} = require('../services/notificationService');

// const ADMIN_NOTIFICATION_MOBILES = [
//   '+91 9043013833',
//   '+91 7402414741',
// ];

const ADMIN_NOTIFICATION_MOBILES = [
  '9000000000',
];

const {
  isValidMobile,
  isValidEmail,
  isValidPincode,
  isRequired,
} = require('../utils/validators');

const {
  successResponse,
  errorResponse,
} = require('../utils/response');

/*
|--------------------------------------------------------------------------
| Create Enquiry
|--------------------------------------------------------------------------
|
| Customer submits a lead from the mobile application.
|
*/

const createEnquiry = async (req, res, next) => {
  try {
    const {
      serviceType,
      enquiryType,
      customerDetails,
      serviceDetails,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Basic Validation
    |--------------------------------------------------------------------------
    */

    if (!isRequired(serviceType)) {
      return errorResponse(
        res,
        'Service type is required',
        400
      );
    }

    if (!isRequired(enquiryType)) {
      return errorResponse(
        res,
        'Enquiry type is required',
        400
      );
    }

    if (!customerDetails) {
      return errorResponse(
        res,
        'Customer details are required',
        400
      );
    }

    const {
      fullName,
      mobile,
      email,
      dob,
      age,
      gender,
      city,
      state,
      pincode,
    } = customerDetails;

    /*
    |--------------------------------------------------------------------------
    | Customer Name
    |--------------------------------------------------------------------------
    */

    if (!isRequired(fullName)) {
      return errorResponse(
        res,
        'Customer name is required',
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Mobile
    |--------------------------------------------------------------------------
    */

    if (!isValidMobile(mobile)) {
      return errorResponse(
        res,
        'Please enter a valid customer mobile number',
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Email
    |--------------------------------------------------------------------------
    */

    if (!isValidEmail(email)) {
      return errorResponse(
        res,
        'Please enter a valid email address',
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Pincode
    |--------------------------------------------------------------------------
    */

    if (pincode && !isValidPincode(pincode)) {
      return errorResponse(
        res,
        'Please enter a valid 6-digit pincode',
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Gender
    |--------------------------------------------------------------------------
    */

    if (
      gender &&
      !['Male', 'Female'].includes(gender)
    ) {
      return errorResponse(
        res,
        'Invalid gender',
        400
      );
    }


console.log('🔥 CREATE ENQUIRY HIT');
console.log('USER ID:', req.user._id);
console.log('BODY:', JSON.stringify(req.body, null, 2));

    /*
    |--------------------------------------------------------------------------
    | Create Enquiry
    |--------------------------------------------------------------------------
    */

    const enquiry = await Enquiry.create({
      customerId: req.user._id,

      serviceType: String(serviceType).trim(),

      enquiryType: String(enquiryType).trim(),

      customerDetails: {
        fullName: String(fullName).trim(),

        mobile: String(mobile).trim(),

        email: String(email || '')
          .trim()
          .toLowerCase(),

        dob: String(dob || '').trim(),

        age:
          age !== undefined &&
          age !== null &&
          age !== ''
            ? Number(age)
            : null,

        gender: gender || '',

        city: String(city || '').trim(),

        state: String(state || '').trim(),

        pincode: String(pincode || '').trim(),
      },

      serviceDetails:
        serviceDetails || {},

      status: 'NEW',

      assignedAgent: null,

      source: 'Mobile App',
    });

    console.log('🔥 MONGODB CREATE COMPLETED');
console.log('DB OBJECT ID:', enquiry._id);
console.log('ENQUIRY ID:', enquiry.enquiryId);


/*
|--------------------------------------------------------------------------
| Send Lead Created Notification
|--------------------------------------------------------------------------
*/

try {
  const user = await User.findById(req.user._id);

  if (user && user.pushTokens?.length) {
    const activeTokens = user.pushTokens.filter(
      (item) =>
        item.isActive &&
        item.token
    );

    await Promise.allSettled(
      activeTokens.map((item) =>
        sendPushNotification({
          token: item.token,

          title: 'MH StepPays 🎉',

          body:
            'Your application has been received successfully. Track your application status in the app.',

          data: {
            type: 'LEAD',
            lead_id: String(enquiry._id),
            enquiry_id: enquiry.enquiryId,
          },
        })
      )
    );

    console.log(
      '🔔 Lead notification sent successfully.'
    );
  } else {
    console.log(
      'ℹ️ No active push token found for customer.'
    );
  }
} catch (notificationError) {
  console.error(
    '⚠️ Lead notification failed:',
    notificationError.message
  );
}

/*
|--------------------------------------------------------------------------
| Send New Lead Notification to Admins
|--------------------------------------------------------------------------
*/

try {
  const admins = await User.find({
    role: 'admin',
    isActive: true,
    mobile: {
      $in: ADMIN_NOTIFICATION_MOBILES,
    },
  });

  console.log(
  '🔎 ADMIN NUMBERS CONFIGURED:',
  ADMIN_NOTIFICATION_MOBILES
);

console.log(
  '🔎 ADMIN USERS FOUND:',
  admins.map((admin) => ({
    id: String(admin._id),
    mobile: admin.mobile,
    role: admin.role,
    isActive: admin.isActive,
    pushTokensCount: admin.pushTokens?.length || 0,
  }))
);

  const adminTokens = admins.flatMap((admin) =>
    (admin.pushTokens || [])
      .filter(
        (item) =>
          item.isActive &&
          item.token
      )
      .map((item) => item.token)
  );

  if (adminTokens.length) {
    const createdDate = new Date(enquiry.createdAt);

    const date = createdDate.toLocaleDateString(
      'en-IN'
    );

    const time = createdDate.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    await Promise.allSettled(
      adminTokens.map((token) =>
        sendPushNotification({
          token,

          title: '🔔 New Lead Received',

          body:
            `Lead ID: ${enquiry.enquiryId} | ` +
            `Customer: ${enquiry.customerDetails.fullName} | ` +
            `Service: ${enquiry.serviceType} | ` +
            `Mobile: ${enquiry.customerDetails.mobile} | ` +
            `${date} ${time}`,

          data: {
            type: 'NEW_LEAD_ADMIN',
            lead_id: String(enquiry._id),
            enquiry_id: enquiry.enquiryId,
            customer_name:
              enquiry.customerDetails.fullName,
            service_type:
              enquiry.serviceType,
            customer_mobile:
              enquiry.customerDetails.mobile,
            created_at:
              enquiry.createdAt,
          },
        })
      )
    );

    console.log(
      '🔔 New lead notification sent to admins.'
    );
  } else {
    console.log(
      'ℹ️ No active admin push tokens found.'
    );
  }
} catch (adminNotificationError) {
  console.error(
    '⚠️ Admin lead notification failed:',
    adminNotificationError.message
  );
}

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return successResponse(
      res,
      'Enquiry submitted successfully',
      {
        enquiryId: enquiry.enquiryId,
        enquiry: {
          id: enquiry._id,
          serviceType: enquiry.serviceType,
          enquiryType: enquiry.enquiryType,
          status: enquiry.status,
          customerDetails:
            enquiry.customerDetails,
          serviceDetails:
            enquiry.serviceDetails,
          source: enquiry.source,
          createdAt: enquiry.createdAt,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Customer Enquiries
|--------------------------------------------------------------------------
*/

const getMyEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({
      customerId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      'Enquiries fetched successfully',
      enquiries
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Single Customer Enquiry
|--------------------------------------------------------------------------
*/

const getMyEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    }).lean();

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    return successResponse(
      res,
      'Enquiry fetched successfully',
      enquiry
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All Enquiries
|--------------------------------------------------------------------------
*/

const getAllEnquiries = async (req, res, next) => {
  try {
    const {
      serviceType,
      status,
      enquiryType,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    /*
    |--------------------------------------------------------------------------
    | Service Filter
    |--------------------------------------------------------------------------
    */

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    if (status) {
      filter.status = status;
    }

    /*
    |--------------------------------------------------------------------------
    | Enquiry Type Filter
    |--------------------------------------------------------------------------
    */

    if (enquiryType) {
      filter.enquiryType = enquiryType;
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      filter.$or = [
        {
          enquiryId: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'customerDetails.fullName': {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'customerDetails.mobile': {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (currentPage - 1) * perPage;

    const [enquiries, total] =
      await Promise.all([
        Enquiry.find(filter)
          .populate(
            'customerId',
            'name mobile email'
          )
          .populate(
            'assignedAgent',
            'name mobile email'
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage)
          .lean(),

        Enquiry.countDocuments(filter),
      ]);

    return successResponse(
      res,
      'Enquiries fetched successfully',
      {
        enquiries,

        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          totalPages: Math.ceil(
            total / perPage
          ),
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get Single Enquiry
|--------------------------------------------------------------------------
*/

const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(
      req.params.id
    )
      .populate(
        'customerId',
        'name mobile email role'
      )
      .populate(
        'assignedAgent',
        'name mobile email role'
      )
      .lean();

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    return successResponse(
      res,
      'Enquiry fetched successfully',
      enquiry
    );
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Enquiry Status
|--------------------------------------------------------------------------
*/
const updateEnquiryStatus = async (
  req,
  res,
  next
) => {
  try {
const {
  status,
  adminNotes,
  statusReason,
} = req.body;

   const allowedStatuses = [
  'NEW',
  'CONTACTED',
  'IN_PROGRESS',
  'DOCUMENT_PENDING',
  'SUBMITTED',
  'IN_REVIEW',
  'ADDITIONAL_DOCUMENTS_REQUIRED',
  'APPROVED',
  'REJECTED',
  'CLOSED',
];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(
        res,
        'Invalid enquiry status',
        400
      );
    }

    const enquiry =
      await Enquiry.findById(
        req.params.id
      );

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    // Keep previous status
    const previousStatus = enquiry.status;

    // Update status
    enquiry.status = status;

    if (adminNotes !== undefined) {
      enquiry.adminNotes =
        String(adminNotes).trim();
    }


    if (statusReason !== undefined) {
  enquiry.statusReason =
    String(statusReason).trim();
}
    await enquiry.save();

    /*
    |--------------------------------------------------------------------------
    | Send Status Update Notification
    |--------------------------------------------------------------------------
    */

    if (previousStatus !== status) {
      try {
        const user = await User.findById(
          enquiry.customerId
        );

        if (
          user &&
          user.pushTokens?.length
        ) {
          const activeTokens =
            user.pushTokens.filter(
              (item) =>
                item.isActive &&
                item.token
            );

          const statusLabels = {
            NEW: 'New',
            CONTACTED: 'Contacted',
            IN_PROGRESS: 'In Progress',
            DOCUMENT_PENDING:
              'Document Pending',
            SUBMITTED: 'Submitted',
            APPROVED: 'Approved',
            REJECTED: 'Rejected',
            CLOSED: 'Closed',
          };

          const statusLabel =
            statusLabels[status] ||
            status;

          await Promise.allSettled(
            activeTokens.map((item) =>
              sendPushNotification({
                token: item.token,

                title:
                  'MH StepPays 🔔',

                body:
  enquiry.statusReason
    ? `Your ${enquiry.serviceType} enquiry status has been updated to ${statusLabel}. Reason: ${enquiry.statusReason}`
    : `Your ${enquiry.serviceType} enquiry status has been updated to ${statusLabel}.`,

data: {
  type: 'LEAD_STATUS_UPDATE',
  lead_id: String(
    enquiry._id
  ),
  enquiry_id:
    enquiry.enquiryId,
  status,
  status_reason:
    enquiry.statusReason || '',
},
              })
            )
          );

          console.log(
            '🔔 Enquiry status notification sent successfully.'
          );
        } else {
          console.log(
            'ℹ️ No active push token found for customer.'
          );
        }
      } catch (notificationError) {
        console.error(
          '⚠️ Status notification failed:',
          notificationError.message
        );
      }
    }

    return successResponse(
      res,
      'Enquiry status updated successfully',
      enquiry
    );
  } catch (error) {
    next(error);
  }
};
/*
|--------------------------------------------------------------------------
| Admin - Assign Agent
|--------------------------------------------------------------------------
*/

const assignEnquiryAgent = async (
  req,
  res,
  next
) => {
  try {
    const {
      agentId,
    } = req.body;

    if (!agentId) {
      return errorResponse(
        res,
        'Agent ID is required',
        400
      );
    }

    const enquiry =
      await Enquiry.findById(
        req.params.id
      );

    if (!enquiry) {
      return errorResponse(
        res,
        'Enquiry not found',
        404
      );
    }

    enquiry.assignedAgent = agentId;

    await enquiry.save();

    return successResponse(
      res,
      'Enquiry assigned successfully',
      enquiry
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getMyEnquiries,
  getMyEnquiryById,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  assignEnquiryAgent,
};