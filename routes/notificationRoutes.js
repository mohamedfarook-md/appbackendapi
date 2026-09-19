const express = require('express');

const {
  registerPushToken,
} = require('../controllers/notificationController');

const {
  protect,
  customerOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/push-token',
  protect,
  customerOnly,
  registerPushToken
);

module.exports = router;