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
const cloudinary = require('cloudinary');
const notificationService = require('../services/notificationService');
const { getIO } = require('../config/socket');

// Fonction helper pour obtenir le prix des documents
const getDocumentPrice = (documentType) => {
  const prices = {
    birth_certificate: 2000,
    marriage_certificate: 2000,
    death_certificate: 2000,
    nationality_certificate: 2000,
    residence_certificate: 2000,
    criminal_record: 2000
  };
  return prices[documentType] || 0;
};

// @desc    Créer une nouvelle demande
// @route   POST /api/requests
// @access  Private (Citoyen)
exports.createRequest = catchAsync(async (req, res) => {
  try {
    // Vérifier si un fichier d'identité a été uploadé
    let identityDocumentUrl = null;
    if (req.file) {
      identityDocumentUrl = req.file.path;
    }

    // Calculer le prix
    const documentPrice = getDocumentPrice(req.body.documentType);
    const deliveryFee = req.body.deliveryMethod === 'delivery' ? 2000 : 0;
    const totalPrice = documentPrice + deliveryFee;

    // Trouver la commune par son nom
    const commune = await Commune.findOne({
      name: { $regex: new RegExp(`^${req.body.commune}$`, 'i') }
    });

    if (!commune) {
      return res.status(404).json({
        success: false,
        message: 'Commune non trouvée'
      });
    }

    // Créer la demande avec les données du formulaire
    const requestData = {
      documentType: req.body.documentType,
      commune: commune._id,
      fullName: req.body.fullName,
      birthDate: req.body.birthDate,
      birthPlace: req.body.birthPlace,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      deliveryMethod: req.body.deliveryMethod,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      identityDocument: identityDocumentUrl,
      status: 'pending',
      user: req.user.id,
      price: totalPrice,
      paymentStatus: 'pending',
      payment: {
        status: 'pending',
        amount: totalPrice,
        date: new Date(),
        method: 'card'
      }
    };

    // Créer la demande dans la base de données
    const request = await Request.create(requestData);

    // Assigner un agent à la demande
    try {
      const agent = await assignRequestToAgent(request._id, request.commune);
      request.agent = agent._id;
      await request.save();
      console.log('Agent assigné avec succès:', agent._id);
    } catch (error) {
      console.error('Erreur lors de l\'assignation de l\'agent:', error);
      // On continue même si l'assignation échoue
    }

    // Créer une notification pour le citoyen
    try {
      await notificationService.createNotification({
        user: req.user.id,
        type: 'request_created',
        title: 'Demande créée avec succès',
        message: 'Votre demande a été créée avec succès. Veuillez attendre la vérification par un agent avant de procéder au paiement.',
        request: request._id
      });

      // Envoyer une notification en temps réel via Socket.IO
      const io = getIO();
      if (io) {
        io.to(req.user.id).emit('notification', {
          type: 'request_created',
          title: 'Demande créée avec succès',
          message: 'Votre demande a été créée avec succès. Veuillez attendre la vérification par un agent avant de procéder au paiement.',
          requestId: request._id
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      // On continue même si la notification échoue
    }

    res.status(201).json({
      success: true,
      data: request,
      message: 'Votre demande a été créée avec succès. Veuillez attendre la vérification par un agent avant de procéder au paiement.'
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Initialiser le paiement pour une demande
// @route   POST /api/requests/:id/payment
// @access  Private (Citoyen)
exports.initializePayment = catchAsync(async (req, res) => {
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
      message: 'Non autorisé à effectuer le paiement pour cette demande'
    });
  }

  // Vérifier si la demande est en attente de paiement
  if (request.status !== 'processing') {
    return res.status(400).json({
      success: false,
      message: 'La demande doit être en traitement pour effectuer le paiement'
    });
  }

  // Mettre à jour l'objet payment avec le montant
  request.payment = {
    ...request.payment,
    amount: request.price,
    status: 'pending',
    method: 'card',
    date: new Date()
  };

  // Créer l'intention de paiement
  const paymentIntent = await createPaymentIntent({
    amount: request.price,
    currency: 'xof',
    requestId: request._id,
    userId: req.user.id
  });

  // Sauvegarder l'ID de l'intention de paiement et mettre à jour la demande
  request.paymentIntentId = paymentIntent.id;
  await request.save();

  res.status(200).json({
    success: true,
    clientSecret: paymentIntent.client_secret
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
  try {
    console.log('Fetching request with ID:', req.params.id);
    
    const request = await Request.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('commune', 'name')
      .populate('agent', 'firstName lastName');
    
    console.log('Found request:', request);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

    // Vérifier les autorisations
    const isOwner = request.user._id.toString() === req.user.id;
    const isAssignedAgent = request.agent && request.agent._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedAgent && !isAdmin) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à accéder à cette demande'
    });
  }

    // Formater les données pour le frontend
    const formattedRequest = {
      id: request._id,
      type: request.documentType,
      status: request.status,
      date: request.createdAt,
      lastUpdate: request.updatedAt,
      details: {
        fullName: request.fullName,
        birthDate: request.birthDate,
        birthPlace: request.birthPlace,
        fatherName: request.fatherName,
        motherName: request.motherName,
        commune: request.commune.name,
        deliveryMethod: request.deliveryMethod,
        phoneNumber: request.phoneNumber,
        address: request.address
      },
      timeline: [
        {
          id: 1,
          status: request.status,
          date: request.updatedAt,
          description: getStatusDescription(request.status)
        }
      ],
      payment: {
        amount: request.price,
        status: request.paymentStatus,
        date: request.updatedAt,
        reference: request._id
      }
    };

  res.status(200).json({
    success: true,
      data: formattedRequest
  });
  } catch (error) {
    console.error('Error in getRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors de la récupération de la demande'
    });
  }
});

// Helper function to get status description
const getStatusDescription = (status) => {
  switch (status) {
    case 'pending':
      return 'Demande soumise';
    case 'processing':
      return 'Demande en cours de traitement';
    case 'completed':
      return 'Demande terminée';
    case 'rejected':
      return 'Demande rejetée';
    default:
      return 'Statut inconnu';
  }
};

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

// @desc    Obtenir toutes les demandes d'un agent
// @route   GET /api/requests/agent/requests
// @access  Private (Agent)
exports.getAgentRequests = catchAsync(async (req, res) => {
  console.log('User ID from token:', req.user._id);
  console.log('User role:', req.user.role);

  // Vérifier si l'utilisateur est un agent
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé. Seuls les agents peuvent accéder à cette ressource.'
    });
  }

  // Vérifier si l'agent a une commune assignée
  const agent = await User.findById(req.user._id);
  console.log('Agent trouvé:', agent ? 'Oui' : 'Non');
  console.log('Commune de l\'agent:', agent?.commune);

  if (!agent || !agent.commune) {
    return res.status(400).json({
      success: false,
      message: 'Aucune commune assignée à cet agent.'
    });
  }

  // Construire la requête
  const query = { agent: req.user._id };
  console.log('Recherche des demandes avec la requête:', query);

  // Compter le nombre total de demandes
  const totalRequests = await Request.countDocuments(query);
  console.log('Nombre total de demandes pour cet agent:', totalRequests);

  // Récupérer toutes les demandes pour le débogage
  const allRequests = await Request.find({});
  console.log('Toutes les demandes dans la base de données:', allRequests);

  // Récupérer les demandes de l'agent avec les informations nécessaires
  const requests = await Request.find(query)
    .populate('user', 'firstName lastName email')
    .populate('commune', 'name')
    .sort('-createdAt');

  console.log('Nombre de demandes trouvées:', requests.length);
  if (requests.length > 0) {
    console.log('Première demande:', requests[0]);
  }

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Obtenir toutes les demandes d'un utilisateur
// @route   GET /api/requests
// @access  Private
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .sort('-createdAt')
      .select('_id documentType status createdAt updatedAt price paymentStatus commune');

    res.json({
      success: true,
      data: requests
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
    console.log('Mise à jour du statut - Données reçues:', { status, note, requestId: req.params.id });

    const request = await Request.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!request) {
      console.log('Demande non trouvée:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    console.log('Demande trouvée:', {
      id: request._id,
      ancienStatut: request.status,
      nouveauStatut: status,
      utilisateur: request.user
    });

    // Vérifier si l'utilisateur est l'agent assigné ou un admin
    const isAssignedAgent = request.agent && request.agent.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedAgent && !isAdmin) {
      console.log('Accès non autorisé:', {
        userId: req.user.id,
        agentId: request.agent?.toString(),
        userRole: req.user.role
      });
      return res.status(401).json({
        success: false,
        message: 'Non autorisé à modifier le statut de cette demande'
      });
    }

    // Mettre à jour le statut et les dates de suivi
    request.status = status;
    
    // Mettre à jour les dates de suivi selon le statut
    if (status === 'processing' && !request.tracking.processedAt) {
      request.tracking.processedAt = new Date();
    } else if (status === 'completed' && !request.tracking.completedAt) {
      request.tracking.completedAt = new Date();
    } else if (status === 'rejected' && !request.tracking.rejectedAt) {
      request.tracking.rejectedAt = new Date();
      request.tracking.rejectionReason = note;
    }

    // Ajouter une note si fournie
    if (note) {
      request.notes.push({
        content: note,
        author: req.user._id
      });
    }

    await request.save();
    console.log('Demande mise à jour avec succès:', {
      id: request._id,
      nouveauStatut: request.status,
      dates: request.tracking
    });

    // Créer une notification pour l'utilisateur
    try {
      const notificationMessage = status === 'completed' 
        ? 'Votre demande a été approuvée.' 
        : status === 'rejected' 
          ? `Votre demande a été rejetée${note ? `: ${note}` : '.'}` 
          : 'Le statut de votre demande a été mis à jour.';

      await notificationService.createNotification({
        user: request.user._id,
        type: notificationService.NOTIFICATION_TYPES.REQUEST_STATUS_UPDATED,
        title: 'Mise à jour de votre demande',
        message: notificationMessage,
        request: request._id
      });

      console.log('Notification créée avec succès pour:', request.user.email);
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
    }

    // Émettre l'événement Socket.IO pour la mise à jour en temps réel
    const io = getIO();
    console.log('Émission de l\'événement Socket.IO:', {
      event: 'request_status_updated',
      requestId: request._id,
      status: request.status
    });
    io.emit('request_status_updated', request);

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error in updateRequestStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors de la mise à jour du statut'
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

// @desc    Obtenir les statistiques des demandes d'un citoyen
// @route   GET /api/requests/statistics
// @access  Private (Citoyen)
exports.getStatistics = catchAsync(async (req, res) => {
  try {
    console.log('Fetching statistics for user:', req.user.id);

    // Obtenir toutes les demandes de l'utilisateur
    const requests = await Request.find({ user: req.user.id });
    console.log('Found requests:', requests.length);

    // Calculer les statistiques
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'en_attente').length;
    const completedRequests = requests.filter(r => r.status === 'terminee').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejetee').length;

    console.log('Calculated statistics:', {
      totalRequests,
      pendingRequests,
      completedRequests,
      rejectedRequests
    });

    // Obtenir les 5 demandes les plus récentes
    const recentRequests = await Request.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5)
      .select('_id documentType status createdAt updatedAt');

    console.log('Recent requests:', recentRequests);

    // Calculer les statistiques par type de document
    const documentsByType = requests.reduce((acc, request) => {
      const type = request.documentType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Convertir en tableau pour l'API
    const documentsByTypeArray = Object.entries(documentsByType).map(([type, count]) => ({
      type,
      count
    }));

    console.log('Documents by type:', documentsByTypeArray);

    // Calculer les statistiques par statut
    const requestsByStatus = requests.reduce((acc, request) => {
      const status = request.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Convertir en tableau pour l'API
    const requestsByStatusArray = Object.entries(requestsByStatus).map(([status, count]) => ({
      status,
      count
    }));

    console.log('Requests by status:', requestsByStatusArray);

    const responseData = {
      totalRequests,
      pendingRequests,
      completedRequests,
      rejectedRequests,
      recentRequests,
      documentsByType: documentsByTypeArray,
      requestsByStatus: requestsByStatusArray
    };

    console.log('Sending response:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors de la récupération des statistiques'
    });
  }
});

// @desc    Mettre une demande en traitement
// @route   PUT /api/requests/:id/process
// @access  Private (Agent)
exports.processRequest = catchAsync(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

  // Vérifier si l'utilisateur est l'agent assigné
  if (!request.agent || request.agent.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à traiter cette demande'
    });
  }

  // Vérifier si la demande est en attente
  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Seules les demandes en attente peuvent être mises en traitement'
    });
  }

  // Mettre à jour le statut
  request.status = 'processing';
  request.timeline = request.timeline || [];
  request.timeline.push({
    status: 'processing',
    date: new Date(),
    description: 'Demande mise en traitement'
  });

  await request.save();

  // Notifier le citoyen
  try {
    await notificationService.createNotification({
      user: request.user,
      type: 'request_status',
      title: 'Demande mise en traitement',
      message: `Votre demande ${request.documentType} a été mise en traitement. Vous pouvez maintenant procéder au paiement.`,
      request: request._id
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Mettre à jour le statut du paiement
// @route   POST /api/requests/:id/payment-status
// @access  Public (pour Stripe)
exports.updatePaymentStatus = catchAsync(async (req, res) => {
  const { paymentIntent, status } = req.body;

  if (!paymentIntent || !status) {
    return res.status(400).json({
      success: false,
      message: 'Payment intent et status sont requis'
    });
  }

  const request = await Request.findOne({ paymentIntentId: paymentIntent });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }

  // Mettre à jour le statut du paiement
  request.paymentStatus = status === 'succeeded' ? 'completed' : status;
  request.payment = {
    ...request.payment,
    status: status === 'succeeded' ? 'paid' : status,
    transactionId: paymentIntent,
    date: new Date()
  };

  await request.save();

  res.status(200).json({
    success: true,
    data: request
  });
}); 