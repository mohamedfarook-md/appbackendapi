const User = require('../models/User');

const registerPushToken = async (req, res, next) => {
  try {
    const { token, platform = 'android' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.pushTokens = (user.pushTokens || []).filter(
      (item) => item.token !== token
    );

    user.pushTokens.push({
      token,
      platform,
      isActive: true,
      lastSeenAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Push token registered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPushToken,
};