const User = require('../models/User');
const Commune = require('../models/Commune');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Créer un agent
// @route   POST /api/admin/agents
// @access  Private/Super Admin
exports.createAgent = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un super admin
  if (!req.user.isSuperAdmin()) {
    return next(new ErrorResponse('Non autorisé', 403));
  }

  const { communeId } = req.body;

  // Vérifier si la commune existe
  const commune = await Commune.findById(communeId);
  if (!commune) {
    return next(new ErrorResponse('Commune non trouvée', 404));
  }

  // Créer l'agent
  const agent = await User.create({
    ...req.body,
    role: 'agent',
    commune: communeId
  });

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