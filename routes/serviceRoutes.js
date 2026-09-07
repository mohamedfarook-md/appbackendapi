const express = require('express');

const {
  getServices,
  getServiceByCode,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');

const {
  protect,
  adminOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer / Public Service APIs
|--------------------------------------------------------------------------
*/

// Get all active services
router.get('/', getServices);

// Get one active service by code
router.get('/:serviceCode', getServiceByCode);


/*
|--------------------------------------------------------------------------
| Admin Service Management APIs
|--------------------------------------------------------------------------
*/

// Create service
router.post(
  '/',
  protect,
  adminOnly,
  createService
);

// Update service
router.put(
  '/:id',
  protect,
  adminOnly,
  updateService
);

// Disable service
router.delete(
  '/:id',
  protect,
  adminOnly,
  deleteService
);

module.exports = router;