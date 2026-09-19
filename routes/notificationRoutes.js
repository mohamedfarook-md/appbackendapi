const express = require('express');

const {
  registerPushToken,
  sendTestNotification,
} = require('../controllers/notificationController');

const {
  protect,
  customerOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Register Push Token
|--------------------------------------------------------------------------
*/

router.post(
  '/push-token',
  protect,
  customerOnly,
  registerPushToken
);

/*
|--------------------------------------------------------------------------
| Send Test Notification
|--------------------------------------------------------------------------
*/

router.post(
  '/test',
  protect,
  customerOnly,
  sendTestNotification
);

module.exports = router;