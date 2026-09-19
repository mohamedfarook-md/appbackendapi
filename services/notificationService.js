const axios = require('axios');

const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  try {
    if (!token) {
      throw new Error('Push token is required.');
    }

    const message = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      message,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      'Push notification error:',
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = {
  sendPushNotification,
};