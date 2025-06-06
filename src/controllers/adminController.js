const User = require('../models/User');
const Commune = require('../models/Commune');
const { NOTIFICATION_TYPES } = require('../services/notificationService');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Créer un administrateur (Super Admin uniquement)
// @route   POST /api/admin/create-admin
// @access  Private (Super Admin)
exports.createAdmin = async (req, res) => {
  try {
    // Vérifier si l'utilisateur actuel est un super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à créer un administrateur'
      });
    }

    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'administrateur
    const admin = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      phoneNumber
    });

    // Créer une notification pour le nouvel admin
    await createNotification(
      admin._id,
      NOTIFICATION_TYPES.ACCOUNT_CREATED,
      'Compte administrateur créé',
      'Votre compte administrateur a été créé avec succès.',
      { role: 'admin' }
    );

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Créer un agent
// @route   POST /api/admin/create-agent
// @access  Private (Admin)
exports.createAgent = async (req, res) => {
  try {
    // Vérifier si l'utilisateur actuel est un admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à créer un agent'
      });
    }

    const { firstName, lastName, email, password, phoneNumber, commune } = req.body;

    // Vérifier si la commune existe
    const communeExists = await Commune.findById(commune);
    if (!communeExists) {
      return res.status(400).json({
        success: false,
        message: 'Commune non trouvée'
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'agent
    const agent = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'agent',
      phoneNumber,
      commune,
      maxDailyRequests: 20,
      dailyRequestCount: 0,
      lastRequestCountReset: new Date()
    });

    // Créer une notification pour le nouvel agent
    await createNotification(
      agent._id,
      NOTIFICATION_TYPES.ACCOUNT_CREATED,
      'Compte agent créé',
      'Votre compte agent a été créé avec succès.',
      { role: 'agent', commune: communeExists.name }
    );

    res.status(201).json({
      success: true,
      message: 'Agent créé avec succès',
      agent: {
        id: agent._id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        role: agent.role,
        commune: communeExists.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir tous les administrateurs
// @route   GET /api/admin/admins
// @access  Private (Super Admin)
exports.getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir la liste des administrateurs'
      });
    }

    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort('-createdAt');

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir tous les agents
// @route   GET /api/admin/agents
// @access  Private (Admin)
exports.getAllAgents = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir la liste des agents'
      });
    }

    const { commune } = req.query;
    const query = { role: 'agent' };

    if (commune) {
      query.commune = commune;
    }

    const agents = await User.find(query)
      .select('-password')
      .populate('commune', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Désactiver/Activer un utilisateur
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier le statut des utilisateurs'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de désactiver un super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de désactiver un super administrateur'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Créer une notification pour l'utilisateur
    await createNotification(
      user._id,
      NOTIFICATION_TYPES.ACCOUNT_STATUS_CHANGED,
      'Statut du compte modifié',
      `Votre compte a été ${user.isActive ? 'activé' : 'désactivé'}.`,
      { isActive: user.isActive }
    );

    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports; 