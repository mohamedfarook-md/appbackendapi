const express = require('express');

const {
  registerCustomer,
  verifySignupOTP,
  forgotPassword,
  sendLoginOTP,
  loginWithPassword,
  loginWithOTP,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CUSTOMER SIGNUP
|--------------------------------------------------------------------------
*/

/*
 * Signup with customer details
 *
 * POST /api/auth/signup
 *
 * Body:
 * {
 *   name,
 *   mobile,
 *   email,
 *   password,
 *   confirmPassword
 * }
 *
 * Response:
 * OTP sent
 */
router.post(
  '/signup',
  registerCustomer
);

/*
 * Final signup OTP verification
 *
 * POST /api/auth/signup/verify-otp
 *
 * Body:
 * {
 *   mobile,
 *   otp
 * }
 *
 * Response:
 * User created + JWT
 */
router.post(
  '/signup/verify-otp',
  verifySignupOTP
);



/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

/*
 * Send forgot password OTP
 *
 * POST /api/auth/forgot-password
 *
 * Body:
 * {
 *   mobile
 * }
 */
router.post(
  '/forgot-password',
  forgotPassword
);


/*
|--------------------------------------------------------------------------
| CUSTOMER LOGIN
|--------------------------------------------------------------------------
*/

/*
 * Send login OTP
 *
 * POST /api/auth/login/send-otp
 */
router.post(
  '/login/send-otp',
  sendLoginOTP
);

/*
 * Login with mobile + password
 *
 * POST /api/auth/login
 */
router.post(
  '/login',
  loginWithPassword
);

/*
 * Login with mobile + OTP
 *
 * POST /api/auth/login/otp
 */
router.post(
  '/login/otp',
  loginWithOTP
);

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

/*
 * Get logged-in user
 *
 * GET /api/auth/me
 *
 * Header:
 * Authorization: Bearer <JWT>
 */
router.get(
  '/me',
  protect,
  getMe
);



module.exports = router;