const Notification = require('../models/Notification');

const createNotification = async ({ recipient, targetRole = 'ALL', title, message, type = 'INFO', link = '' }) => {
  try {
    const notification = await Notification.create({
      recipient,
      targetRole,
      title,
      message,
      type,
      link
    });
    return notification;
  } catch (error) {
    console.error('Notification Error:', error.message);
  }
};

module.exports = { createNotification };
