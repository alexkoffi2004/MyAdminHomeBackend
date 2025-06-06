const Request = require('../models/Request');
const { catchAsync } = require('../utils/errorHandler');

// @desc    Obtenir les statistiques d'un agent
// @route   GET /api/agent/statistics
// @access  Private (Agent)
exports.getStats = catchAsync(async (req, res) => {
  // Obtenir la date de début d'aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compter les demandes par statut pour l'agent
  const pendingRequests = await Request.countDocuments({ 
    agent: req.user.id,
    status: 'en_attente'
  });

  const processingRequests = await Request.countDocuments({ 
    agent: req.user.id,
    status: 'en_cours'
  });

  const completedToday = await Request.countDocuments({ 
    agent: req.user.id,
    status: 'terminee',
    updatedAt: { $gte: today }
  });

  const rejectedToday = await Request.countDocuments({ 
    agent: req.user.id,
    status: 'rejetee',
    updatedAt: { $gte: today }
  });

  // Calculer les tendances (pourcentage de variation sur 30 jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tendance des demandes en attente
  const newPendingRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'en_attente',
    createdAt: { $gte: thirtyDaysAgo }
  });
  const pendingTrend = pendingRequests > 0 ? Math.round((newPendingRequests / pendingRequests) * 100) : 0;

  // Tendance des demandes en cours
  const newProcessingRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'en_cours',
    createdAt: { $gte: thirtyDaysAgo }
  });
  const processingTrend = processingRequests > 0 ? Math.round((newProcessingRequests / processingRequests) * 100) : 0;

  // Tendance des demandes complétées
  const newCompletedRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'terminee',
    updatedAt: { $gte: thirtyDaysAgo }
  });
  const completedTrend = completedToday > 0 ? Math.round((newCompletedRequests / completedToday) * 100) : 0;

  // Tendance des demandes rejetées
  const newRejectedRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'rejetee',
    updatedAt: { $gte: thirtyDaysAgo }
  });
  const rejectedTrend = rejectedToday > 0 ? Math.round((newRejectedRequests / rejectedToday) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      pendingRequests,
      processingRequests,
      completedToday,
      rejectedToday,
      trends: {
        pending: { value: pendingTrend, isPositive: pendingTrend >= 0 },
        processing: { value: processingTrend, isPositive: processingTrend >= 0 },
        completed: { value: completedTrend, isPositive: completedTrend >= 0 },
        rejected: { value: rejectedTrend, isPositive: rejectedTrend >= 0 }
      }
    }
  });
});

// @desc    Obtenir les demandes à traiter pour un agent
// @route   GET /api/agent/statistics/pending-requests
// @access  Private (Agent)
exports.getPendingRequests = catchAsync(async (req, res) => {
  // Obtenir les demandes en attente
  const pendingRequests = await Request.find({ 
    agent: req.user.id,
    status: 'en_attente'
  })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName')
    .limit(5);

  // Formater les demandes
  const formattedRequests = pendingRequests.map(request => ({
    id: request._id,
    name: `${request.user.firstName} ${request.user.lastName}`,
    type: request.documentType,
    date: request.createdAt,
    status: request.isUrgent ? 'urgent' : 'normal'
  }));

  // Vérifier les alertes
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const overdueRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'en_attente',
    createdAt: { $lte: fortyEightHoursAgo }
  });

  const urgentRequests = await Request.countDocuments({
    agent: req.user.id,
    status: 'en_attente',
    isUrgent: true
  });

  res.status(200).json({
    success: true,
    data: {
      requests: formattedRequests,
      alerts: {
        overdueRequests,
        urgentRequests
      }
    }
  });
}); 