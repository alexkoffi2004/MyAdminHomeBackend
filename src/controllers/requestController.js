const Request = require('../models/Request');
const User = require('../models/User');
const Commune = require('../models/Commune');
const { uploadFile } = require('../services/cloudinaryService');
const { createPaymentIntent, savePayment } = require('../services/stripeService');
const { generateReceipt } = require('../services/pdfService');
const { assignRequestToAgent } = require('../services/agentAssignmentService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { catchAsync } = require('../utils/errorHandler');

// @desc    Créer une nouvelle demande
// @route   POST /api/requests
// @access  Private (Citoyen)
exports.createRequest = catchAsync(async (req, res) => {
  const request = await Request.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json({
    success: true,
    data: request
  });
});

// @desc    Obtenir toutes les demandes d'un citoyen
// @route   GET /api/requests
// @access  Private (Citoyen)
exports.getRequests = catchAsync(async (req, res) => {
  const requests = await Request.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Obtenir une demande spécifique
// @route   GET /api/requests/:id
// @access  Private (Citoyen, Agent, Admin)
exports.getRequest = catchAsync(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

  // Vérifier si l'utilisateur est le propriétaire de la demande
  if (request.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à accéder à cette demande'
    });
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Mettre à jour une demande
// @route   PUT /api/requests/:id
// @access  Private (Citoyen, Agent, Admin)
exports.updateRequest = catchAsync(async (req, res) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

  // Vérifier si l'utilisateur est le propriétaire de la demande
  if (request.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à modifier cette demande'
    });
  }

  request = await Request.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Supprimer une demande
// @route   DELETE /api/requests/:id
// @access  Private (Citoyen, Admin)
exports.deleteRequest = catchAsync(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

  // Vérifier si l'utilisateur est le propriétaire de la demande
  if (request.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à supprimer cette demande'
    });
  }

  await request.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir les demandes d'un agent
// @route   GET /api/requests/agent
// @access  Private (Agent)
exports.getAgentRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {
      assignedTo: req.user._id
    };

    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .sort('-createdAt')
      .populate('user', 'firstName lastName email')
      .populate('payment', 'status amount')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Request.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir toutes les demandes d'un utilisateur
// @route   GET /api/requests
// @access  Private
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('payment', 'status amount');

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mettre à jour le statut d'une demande (Agent/Admin)
// @route   PUT /api/requests/:id/status
// @access  Private (Agent/Admin)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    request.status = status;
    if (note) {
      request.notes.push({
        content: note,
        author: req.user._id
      });
    }

    // Si la demande est complétée, générer le document
    if (status === 'completed') {
      // Logique de génération du document
      // ...
    }

    await request.save();

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir toutes les demandes (Agent/Admin)
// @route   GET /api/requests/all
// @access  Private (Agent/Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const { status, documentType, commune, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (documentType) query.documentType = documentType;
    if (commune) query.commune = commune;

    const requests = await Request.find(query)
      .sort('-createdAt')
      .populate('user', 'firstName lastName email')
      .populate('payment', 'status amount')
      .populate('assignedTo', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Request.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Fonction utilitaire pour obtenir le prix d'un document
const getDocumentPrice = (documentType) => {
  switch (documentType) {
    case 'birth_certificate':
      return 1000;
    case 'birth_declaration':
      return 1500;
    case 'death_certificate':
      return 1500;
    default:
      return 0;
  }
}; 