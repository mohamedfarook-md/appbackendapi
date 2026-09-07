const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(String(mobile || '').trim());
};

const isValidEmail = (email) => {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email).trim()
  );
};

const isValidPassword = (password) => {
  if (!password) return false;

  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128
  );
};

const isValidOTP = (otp) => {
  return /^\d{6}$/.test(String(otp || '').trim());
};

const isRequired = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim().length > 0
  );
};

const isValidPincode = (pincode) => {
  return /^\d{6}$/.test(String(pincode || '').trim());
};

module.exports = {
  isValidMobile,
  isValidEmail,
  isValidPassword,
  isValidOTP,
  isRequired,
  isValidPincode,
};