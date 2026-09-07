const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const {
  isValidMobile,
  isValidOTP,
} = require('../utils/validators');

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

/*
|--------------------------------------------------------------------------
| Generate and Save OTP
|--------------------------------------------------------------------------
*/

const createOTP = async (mobile, purpose) => {
  const cleanMobile = String(mobile || '').trim();

  if (!isValidMobile(cleanMobile)) {
    throw new Error('Please enter a valid mobile number');
  }

  if (!['signup', 'login', 'forgot_password'].includes(purpose)) {
    throw new Error('Invalid OTP purpose');
  }

  /*
  |--------------------------------------------------------------------------
  | Remove previous unused OTPs
  |--------------------------------------------------------------------------
  */

  await OTP.deleteMany({
    mobile: cleanMobile,
    purpose,
    isVerified: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Generate OTP
  |--------------------------------------------------------------------------
  */

  const otp = generateOTP();

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  /*
  |--------------------------------------------------------------------------
  | Save OTP
  |--------------------------------------------------------------------------
  */

  const otpRecord = await OTP.create({
    mobile: cleanMobile,
    otp,
    purpose,
    expiresAt,
  });

  /*
  |--------------------------------------------------------------------------
  | SMS Integration
  |--------------------------------------------------------------------------
  |
  | SMS provider will be connected here later.
  |
  */

  console.log(
    `📱 OTP generated for ${cleanMobile}: ${otp}`
  );

  return {
    otpId: otpRecord._id,
    expiresAt,
  };
};

/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

const verifyOTP = async (mobile, otp, purpose) => {
  const cleanMobile = String(mobile || '').trim();
  const cleanOTP = String(otp || '').trim();

  if (!isValidMobile(cleanMobile)) {
    throw new Error('Please enter a valid mobile number');
  }

  if (!isValidOTP(cleanOTP)) {
    throw new Error('Please enter a valid 6-digit OTP');
  }

  const otpRecord = await OTP.findOne({
    mobile: cleanMobile,
    purpose,
    isVerified: false,
  })
    .sort({ createdAt: -1 })
    .select('+otp');

  if (!otpRecord) {
    throw new Error('OTP not found or already used');
  }

  /*
  |--------------------------------------------------------------------------
  | Check Expiry
  |--------------------------------------------------------------------------
  */

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw new Error('OTP has expired. Please request a new OTP');
  }

  /*
  |--------------------------------------------------------------------------
  | Check Attempts
  |--------------------------------------------------------------------------
  */

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw new Error(
      'Maximum OTP attempts exceeded. Please request a new OTP'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Compare OTP
  |--------------------------------------------------------------------------
  */

  if (otpRecord.otp !== cleanOTP) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remainingAttempts =
      MAX_OTP_ATTEMPTS - otpRecord.attempts;

    throw new Error(
      remainingAttempts > 0
        ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining`
        : 'Maximum OTP attempts exceeded. Please request a new OTP'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Mark OTP Verified
  |--------------------------------------------------------------------------
  */

  otpRecord.isVerified = true;
  await otpRecord.save();

  return {
    success: true,
    otpId: otpRecord._id,
  };
};

/*
|--------------------------------------------------------------------------
| Delete OTP
|--------------------------------------------------------------------------
*/

const deleteOTP = async (mobile, purpose) => {
  const cleanMobile = String(mobile || '').trim();

  await OTP.deleteMany({
    mobile: cleanMobile,
    purpose,
  });
};

module.exports = {
  createOTP,
  verifyOTP,
  deleteOTP,
};