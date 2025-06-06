const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Types de notifications
const NOTIFICATION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_UPDATED: 'request_updated',
  REQUEST_COMPLETED: 'request_completed',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_ASSIGNED: 'request_assigned',
  REQUEST_REASSIGNED: 'request_reassigned',
  REQUEST_STATUS_UPDATED: 'request_status_updated',
  PAYMENT_RECEIVED: 'payment_received',
  DOCUMENT_GENERATED: 'document_generated',
  SYSTEM_ALERT: 'system_alert'
};

// Créer une notification
const createNotification = async (data) => {
  try {
    console.log('Creating notification with data:', data);
    const notification = await Notification.create(data);
    console.log('Notification created:', notification);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

// Obtenir les notifications d'un utilisateur
const getUserNotifications = async (userId, { page = 1, limit = 10, unreadOnly = false }) => {
  try {
    const query = { user: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('request', 'documentType status');

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

// Marquer une notification comme lue
const markAsRead = async (notificationId, userId) => {
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
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
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
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
}; 