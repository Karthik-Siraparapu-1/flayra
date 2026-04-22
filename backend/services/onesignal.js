const sendPushNotification = async (userIds, title, message, data = {}) => {
  const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONE_SIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
    console.warn("OneSignal credentials not configured.");
    return null;
  }

  try {
    const body = {
      app_id: ONE_SIGNAL_APP_ID,
      include_external_user_ids: userIds, // Use object IDs as external user IDs
      contents: { en: message },
      headings: { en: title },
      data: data
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error("Error sending OneSignal push:", err);
    return null;
  }
};

module.exports = { sendPushNotification };
