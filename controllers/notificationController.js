const User = require('../models/User');

const {
  sendPushNotification,
} = require('../services/notificationService');

/*
|--------------------------------------------------------------------------
| Register Push Token
|--------------------------------------------------------------------------
*/

const registerPushToken = async (req, res, next) => {
  try {
    const {
      token,
      platform = 'android',
    } = req.body;

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

/*
|--------------------------------------------------------------------------
| Send Test Notification
|--------------------------------------------------------------------------
*/

const sendTestNotification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const activeToken = (user.pushTokens || []).find(
      (item) =>
        item.isActive &&
        item.token
    );

    if (!activeToken) {
      return res.status(404).json({
        success: false,
        message:
          'No active push token found for this user.',
      });
    }

    const result = await sendPushNotification({
      token: activeToken.token,

      title: 'MH StepPays 🎉',

      body:
        'Your push notification is working successfully!',

      data: {
        type: 'TEST',
      },
    });

    return res.status(200).json({
      success: true,
      message:
        'Test notification sent successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| Send Login Success Notification
|--------------------------------------------------------------------------
*/

const sendLoginSuccessNotification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const activeTokens = (user.pushTokens || []).filter(
      (item) =>
        item.isActive &&
        item.token
    );

    if (!activeTokens.length) {
      return res.status(404).json({
        success: false,
        message: 'No active push token found for this user.',
      });
    }

    await Promise.allSettled(
      activeTokens.map((item) =>
        sendPushNotification({
          token: item.token,

          title: 'Welcome back to MH StepPays 👋',

          body:
            'You have successfully logged in to MH StepPays.',

          data: {
            type: 'LOGIN',
          },
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: 'Login success notification sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| Export Controllers
|--------------------------------------------------------------------------
*/

module.exports = {
  registerPushToken,
  sendTestNotification,
  sendLoginSuccessNotification
};