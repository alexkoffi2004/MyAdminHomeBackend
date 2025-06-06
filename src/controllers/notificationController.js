const notificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/errorHandler');

// Obtenir les notifications d'un utilisateur
exports.getNotifications = catchAsync(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const result = await notificationService.getUserNotifications(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    unreadOnly: unreadOnly === 'true'
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// Marquer une notification comme lue
exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: notification
  });
});

// Marquer toutes les notifications comme lues
exports.markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Toutes les notifications ont été marquées comme lues'
  });
});

// Supprimer une notification
exports.deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Notification supprimée avec succès'
  });
}); 