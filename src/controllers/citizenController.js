const Request = require('../models/Request');
const { catchAsync } = require('../utils/errorHandler');

// @desc    Obtenir les statistiques d'un citoyen
// @route   GET /api/citizen/statistics
// @access  Private (Citoyen)
exports.getStats = catchAsync(async (req, res) => {
  // Compter les demandes par statut pour le citoyen
  const totalRequests = await Request.countDocuments({ user: req.user.id });
  const pendingRequests = await Request.countDocuments({ user: req.user.id, status: 'en_attente' });
  const processingRequests = await Request.countDocuments({ user: req.user.id, status: 'en_cours' });
  const completedRequests = await Request.countDocuments({ user: req.user.id, status: 'terminee' });
  const rejectedRequests = await Request.countDocuments({ user: req.user.id, status: 'rejetee' });

  // Calculer les statistiques de paiement
  const totalPayments = await Request.aggregate([
    { $match: { user: req.user.id } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  const pendingPayments = await Request.aggregate([
    { $match: { user: req.user.id, status: { $in: ['en_attente', 'en_cours'] } } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  const completedPayments = await Request.aggregate([
    { $match: { user: req.user.id, status: 'terminee' } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  // Calculer les tendances (pourcentage de variation sur 30 jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tendance des demandes
  const newRequests = await Request.countDocuments({
    user: req.user.id,
    createdAt: { $gte: thirtyDaysAgo }
  });
  const requestTrend = totalRequests > 0 ? Math.round((newRequests / totalRequests) * 100) : 0;

  // Tendance des demandes complétées
  const newCompletedRequests = await Request.countDocuments({
    user: req.user.id,
    status: 'terminee',
    updatedAt: { $gte: thirtyDaysAgo }
  });
  const completedTrend = completedRequests > 0 ? Math.round((newCompletedRequests / completedRequests) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalRequests,
      pendingRequests,
      processingRequests,
      completedRequests,
      rejectedRequests,
      totalPayments: totalPayments[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      completedPayments: completedPayments[0]?.total || 0,
      trends: {
        requests: { value: requestTrend, isPositive: requestTrend >= 0 },
        completed: { value: completedTrend, isPositive: completedTrend >= 0 }
      }
    }
  });
});

// @desc    Obtenir les paiements récents d'un citoyen
// @route   GET /api/citizen/statistics/payments
// @access  Private (Citoyen)
exports.getRecentPayments = catchAsync(async (req, res) => {
  const recentRequests = await Request.find({ 
    user: req.user.id,
    status: 'terminee'
  })
    .sort({ updatedAt: -1 })
    .limit(5);

  const payments = recentRequests.map(request => ({
    id: request._id,
    documentType: request.documentType,
    amount: request.price,
    date: request.updatedAt.toLocaleDateString('fr-FR'),
    status: 'success'
  }));

  res.status(200).json({
    success: true,
    data: payments
  });
}); 