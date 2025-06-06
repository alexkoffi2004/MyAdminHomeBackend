const User = require('../models/User');
const Commune = require('../models/Commune');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Request = require('../models/Request');
const { catchAsync } = require('../utils/errorHandler');

// @desc    Créer un agent
// @route   POST /api/admin/agents
// @access  Private/Admin
exports.createAgent = asyncHandler(async (req, res, next) => {
  console.log('Tentative de création d\'agent:', req.body);
  console.log('Utilisateur actuel:', req.user);

  // Vérifier si l'utilisateur est un admin
  if (req.user.role !== 'admin') {
    console.log('Accès refusé: utilisateur n\'est pas admin');
    return next(new ErrorResponse('Non autorisé', 403));
  }

  const { communeId } = req.body;

  // Vérifier si la commune existe en cherchant par son nom (insensible à la casse)
  const commune = await Commune.findOne({
    name: { $regex: new RegExp(`^${communeId}$`, 'i') }
  });
  
  if (!commune) {
    console.log('Commune non trouvée:', communeId);
    return next(new ErrorResponse('Commune non trouvée', 404));
  }

  // Créer l'agent avec l'ID de la commune et une adresse par défaut
  const agent = await User.create({
    ...req.body,
    role: 'agent',
    commune: commune._id,
    address: `${commune.name}, Abidjan, Côte d'Ivoire`,
    maxDailyRequests: 20,
    dailyRequestCount: 0,
    isActive: true
  });

  console.log('Agent créé avec succès:', agent);

  res.status(201).json({
    success: true,
    data: agent
  });
});

// @desc    Obtenir tous les agents
// @route   GET /api/admin/agents
// @access  Private/Super Admin
exports.getAgents = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un super admin
  if (!req.user.isSuperAdmin()) {
    return next(new ErrorResponse('Non autorisé', 403));
  }

  const agents = await User.find({ role: 'agent' })
    .populate('commune', 'name');

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents
  });
});

// @desc    Obtenir un agent
// @route   GET /api/admin/agents/:id
// @access  Private/Super Admin
exports.getAgent = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un super admin
  if (!req.user.isSuperAdmin()) {
    return next(new ErrorResponse('Non autorisé', 403));
  }

  const agent = await User.findOne({ _id: req.params.id, role: 'agent' })
    .populate('commune', 'name');

  if (!agent) {
    return next(new ErrorResponse('Agent non trouvé', 404));
  }

  res.status(200).json({
    success: true,
    data: agent
  });
});

// @desc    Mettre à jour un agent
// @route   PUT /api/admin/agents/:id
// @access  Private/Super Admin
exports.updateAgent = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un super admin
  if (!req.user.isSuperAdmin()) {
    return next(new ErrorResponse('Non autorisé', 403));
  }

  let agent = await User.findOne({ _id: req.params.id, role: 'agent' });

  if (!agent) {
    return next(new ErrorResponse('Agent non trouvé', 404));
  }

  // Si une nouvelle commune est spécifiée, vérifier qu'elle existe
  if (req.body.commune) {
    const commune = await Commune.findById(req.body.commune);
    if (!commune) {
      return next(new ErrorResponse('Commune non trouvée', 404));
    }
  }

  // Mettre à jour l'agent
  agent = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('commune', 'name');

  res.status(200).json({
    success: true,
    data: agent
  });
});

// @desc    Supprimer un agent
// @route   DELETE /api/admin/agents/:id
// @access  Private/Super Admin
exports.deleteAgent = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un super admin
  if (!req.user.isSuperAdmin()) {
    return next(new ErrorResponse('Non autorisé', 403));
  }

  const agent = await User.findOne({ _id: req.params.id, role: 'agent' });

  if (!agent) {
    return next(new ErrorResponse('Agent non trouvé', 404));
  }

  await agent.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir les statistiques admin
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = catchAsync(async (req, res) => {
  // Compter le nombre total d'utilisateurs
  const totalUsers = await User.countDocuments({ role: 'citizen' });
  
  // Compter le nombre total d'agents
  const totalAgents = await User.countDocuments({ role: 'agent' });
  
  // Compter le nombre total de demandes
  const totalRequests = await Request.countDocuments();
  
  // Compter le nombre total de documents (demandes complétées)
  const totalDocuments = await Request.countDocuments({ status: 'completed' });
  
  // Calculer les revenus totaux
  const completedRequests = await Request.find({ status: 'completed' });
  const revenue = completedRequests.reduce((total, request) => total + (request.price || 0), 0);
  
  // Compter les demandes par statut
  const pendingRequests = await Request.countDocuments({ status: 'pending' });
  const processingRequests = await Request.countDocuments({ status: 'processing' });
  const completedRequestsCount = await Request.countDocuments({ status: 'completed' });
  const rejectedRequests = await Request.countDocuments({ status: 'rejected' });

  // Calculer les tendances (pourcentage de variation sur 30 jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tendance des utilisateurs
  const newUsers = await User.countDocuments({
    role: 'citizen',
    createdAt: { $gte: thirtyDaysAgo }
  });
  const userTrend = totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0;

  // Tendance des agents
  const newAgents = await User.countDocuments({
    role: 'agent',
    createdAt: { $gte: thirtyDaysAgo }
  });
  const agentTrend = totalAgents > 0 ? Math.round((newAgents / totalAgents) * 100) : 0;

  // Tendance des demandes
  const newRequests = await Request.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  const requestTrend = totalRequests > 0 ? Math.round((newRequests / totalRequests) * 100) : 0;

  // Tendance des revenus
  const recentRevenue = completedRequests
    .filter(request => request.updatedAt >= thirtyDaysAgo)
    .reduce((total, request) => total + (request.price || 0), 0);
  const revenueTrend = revenue > 0 ? Math.round((recentRevenue / revenue) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalAgents,
      totalRequests,
      totalDocuments,
      revenue,
      pendingRequests,
      processingRequests,
      completedRequests: completedRequestsCount,
      rejectedRequests,
      trends: {
        users: { value: userTrend, isPositive: userTrend >= 0 },
        agents: { value: agentTrend, isPositive: agentTrend >= 0 },
        requests: { value: requestTrend, isPositive: requestTrend >= 0 },
        revenue: { value: revenueTrend, isPositive: revenueTrend >= 0 }
      }
    }
  });
});

// @desc    Obtenir les paiements récents
// @route   GET /api/admin/payments/recent
// @access  Private/Admin
exports.getRecentPayments = catchAsync(async (req, res) => {
  const recentRequests = await Request.find({ status: 'completed' })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName');

  const payments = recentRequests.map(request => ({
    id: request._id,
    user: `${request.user.firstName} ${request.user.lastName}`,
    amount: request.price,
    date: request.updatedAt.toLocaleDateString('fr-FR'),
    status: 'success'
  }));

  res.status(200).json({
    success: true,
    data: payments
  });
});

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users
  });
});

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('Utilisateur non trouvé', 404));
  }

  // Ne pas permettre de changer le mot de passe via cette route
  delete req.body.password;

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Supprimer un utilisateur
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('Utilisateur non trouvé', 404));
  }

  // Ne pas permettre de supprimer un admin
  if (user.role === 'admin') {
    return next(new ErrorResponse('Impossible de supprimer un administrateur', 403));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 