const express = require('express');

const {
  adminLogin,
  getAdminProfile,
} = require('../controllers/adminAuthController');

const {
  protect,
  adminOnly,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

/*
 * Admin login
 * POST /api/admin/auth/login
 */
router.post(
  '/login',
  adminLogin
);


/*
 * Get logged-in admin profile
 * GET /api/admin/auth/me
 */
router.get(
  '/me',
  protect,
  adminOnly,
  getAdminProfile
);


module.exports = router;