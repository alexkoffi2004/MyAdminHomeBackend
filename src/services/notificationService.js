const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Types de notifications
const NOTIFICATION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_UPDATED: 'request_updated',
  REQUEST_COMPLETED: 'request_completed',
  PAYMENT_RECEIVED: 'payment_received',
  DOCUMENT_GENERATED: 'document_generated',
  SYSTEM_ALERT: 'system_alert'
};

// Créer une notification
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data
    });

    // Envoyer un email si nécessaire
    if (type === NOTIFICATION_TYPES.REQUEST_COMPLETED || 
        type === NOTIFICATION_TYPES.DOCUMENT_GENERATED) {
      const user = await User.findById(userId);
      await sendEmail(
        user.email,
        title,
        `<h1>${title}</h1><p>${message}</p>`
      );
    }

    return notification;
  } catch (error) {
    throw new Error(`Erreur lors de la création de la notification: ${error.message}`);
  }
};

// Marquer une notification comme lue
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return notification;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de la notification: ${error.message}`);
  }
};

// Marquer toutes les notifications comme lues
const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour des notifications: ${error.message}`);
  }
};

// Obtenir les notifications non lues
const getUnreadNotifications = async (userId) => {
  try {
    return await Notification.find({
      user: userId,
      read: false
    }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
  }
};

// Obtenir toutes les notifications
const getAllNotifications = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ user: userId });

    return {
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
  }
};

// Supprimer une notification
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return notification;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de la notification: ${error.message}`);
  }
};

// Supprimer toutes les notifications
const deleteAllNotifications = async (userId) => {
  try {
    await Notification.deleteMany({ user: userId });
  } catch (error) {
    throw new Error(`Erreur lors de la suppression des notifications: ${error.message}`);
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getAllNotifications,
  deleteNotification,
  deleteAllNotifications
}; 