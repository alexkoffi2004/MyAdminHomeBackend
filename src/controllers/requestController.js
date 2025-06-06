const Request = require('../models/Request');
const User = require('../models/User');
const Commune = require('../models/Commune');
const { uploadFile } = require('../services/cloudinaryService');
const { createPaymentIntent, savePayment } = require('../services/stripeService');
const { generateReceipt } = require('../services/pdfService');
const { assignRequestToAgent } = require('../services/agentAssignmentService');

// @desc    Créer une nouvelle demande
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const {
      documentType,
      commune,
      fullName,
      birthDate,
      birthPlace,
      fatherName,
      motherName,
      deliveryMethod,
      address,
      phoneNumber,
      declarantName,
      declarantRelation,
      deathDate,
      deathPlace,
      deathCause
    } = req.body;

    // Vérifier si la commune existe
    const communeExists = await Commune.findById(commune);
    if (!communeExists) {
      return res.status(400).json({
        success: false,
        message: 'Commune non trouvée'
      });
    }

    // Calculer les prix
    const documentPrice = getDocumentPrice(documentType);
    const deliveryFee = deliveryMethod === 'delivery' ? 2000 : 0;
    const totalPrice = documentPrice + deliveryFee;

    // Créer la demande
    const request = await Request.create({
      user: req.user._id,
      documentType,
      commune,
      fullName,
      birthDate,
      birthPlace,
      fatherName,
      motherName,
      deliveryMethod,
      address,
      phoneNumber,
      declarantName,
      declarantRelation,
      deathDate,
      deathPlace,
      deathCause,
      documentPrice,
      deliveryFee,
      totalPrice
    });

    // Upload des documents si présents
    if (req.files) {
      const documents = [];
      for (const [type, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          const result = await uploadFile(files[0]);
          documents.push({
            type,
            url: result.url,
            publicId: result.publicId
          });
        }
      }
      request.documents = documents;
      await request.save();
    }

    // Assigner un agent à la demande
    try {
      const agent = await assignRequestToAgent(request._id, commune);
      request.assignedTo = agent._id;
      await request.save();
    } catch (error) {
      // Si aucun agent n'est disponible, la demande reste en attente
      request.status = 'pending';
      await request.save();
    }

    // Créer l'intention de paiement
    const paymentIntent = await createPaymentIntent(totalPrice);

    // Enregistrer le paiement
    const payment = await savePayment({
      request: request._id,
      user: req.user._id,
      amount: totalPrice,
      paymentMethod: 'card',
      status: 'pending',
      stripePaymentId: paymentIntent.id
    });

    // Mettre à jour la demande avec le paiement
    request.payment = payment._id;
    await request.save();

    // Mettre à jour les statistiques de la commune
    await Commune.findByIdAndUpdate(commune, {
      $inc: {
        totalRequests: 1,
        pendingRequests: 1
      }
    });

    res.status(201).json({
      success: true,
      request,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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

// @desc    Obtenir une demande spécifique
// @route   GET /api/requests/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('payment', 'status amount')
      .populate('assignedTo', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Vérifier si l'utilisateur est autorisé à voir cette demande
    if (request.user._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'agent' && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cette demande'
      });
    }

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