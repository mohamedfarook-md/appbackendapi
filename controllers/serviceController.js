const Service = require('../models/Service');
const {
  successResponse,
  errorResponse,
} = require('../utils/response');

/**
 * GET /api/services
 * Get all active services for customer app
 */
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({
      isActive: true,
      enquiryEnabled: true,
    })
      .sort({ displayOrder: 1, serviceName: 1 })
      .lean();

    return successResponse(
      res,
      'Services fetched successfully',
      services
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:serviceCode
 * Get one service by service code
 */
const getServiceByCode = async (req, res, next) => {
  try {
    const serviceCode = String(
      req.params.serviceCode || ''
    )
      .trim()
      .toUpperCase();

    if (!serviceCode) {
      return errorResponse(
        res,
        'Service code is required',
        400
      );
    }

    const service = await Service.findOne({
      serviceCode,
      isActive: true,
    }).lean();

    if (!service) {
      return errorResponse(
        res,
        'Service not found',
        404
      );
    }

    return successResponse(
      res,
      'Service fetched successfully',
      service
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/services
 * Create a new service
 * Admin use
 */
const createService = async (req, res, next) => {
  try {
    const {
      serviceCode,
      serviceName,
      description,
      category,
      icon,
      displayOrder,
      enquiryEnabled,
    } = req.body;

    if (!serviceCode) {
      return errorResponse(
        res,
        'Service code is required',
        400
      );
    }

    if (!serviceName) {
      return errorResponse(
        res,
        'Service name is required',
        400
      );
    }

    const cleanCode = String(serviceCode)
      .trim()
      .toUpperCase();

    const existingService = await Service.findOne({
      serviceCode: cleanCode,
    });

    if (existingService) {
      return errorResponse(
        res,
        'Service code already exists',
        409
      );
    }

    const service = await Service.create({
      serviceCode: cleanCode,
      serviceName: String(serviceName).trim(),
      description: description
        ? String(description).trim()
        : '',
      category: category
        ? String(category).trim()
        : 'Financial Services',
      icon: icon
        ? String(icon).trim()
        : '',
      displayOrder:
        displayOrder !== undefined
          ? Number(displayOrder)
          : 0,
      enquiryEnabled:
        enquiryEnabled !== undefined
          ? Boolean(enquiryEnabled)
          : true,
    });

    return successResponse(
      res,
      'Service created successfully',
      service,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/services/:id
 * Update a service
 * Admin use
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return errorResponse(
        res,
        'Service not found',
        404
      );
    }

    const {
      serviceCode,
      serviceName,
      description,
      category,
      icon,
      displayOrder,
      isActive,
      enquiryEnabled,
    } = req.body;

    if (serviceCode !== undefined) {
      service.serviceCode = String(serviceCode)
        .trim()
        .toUpperCase();
    }

    if (serviceName !== undefined) {
      service.serviceName = String(serviceName).trim();
    }

    if (description !== undefined) {
      service.description = String(description).trim();
    }

    if (category !== undefined) {
      service.category = String(category).trim();
    }

    if (icon !== undefined) {
      service.icon = String(icon).trim();
    }

    if (displayOrder !== undefined) {
      service.displayOrder = Number(displayOrder);
    }

    if (isActive !== undefined) {
      service.isActive = Boolean(isActive);
    }

    if (enquiryEnabled !== undefined) {
      service.enquiryEnabled = Boolean(enquiryEnabled);
    }

    const updatedService = await service.save();

    return successResponse(
      res,
      'Service updated successfully',
      updatedService
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/services/:id
 * Soft delete a service
 * Admin use
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return errorResponse(
        res,
        'Service not found',
        404
      );
    }

    service.isActive = false;
    service.enquiryEnabled = false;

    await service.save();

    return successResponse(
      res,
      'Service disabled successfully',
      null
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceByCode,
  createService,
  updateService,
  deleteService,
};