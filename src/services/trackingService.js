const Request = require('../models/Request');
const { NOTIFICATION_TYPES } = require('./notificationService');
const { createNotification } = require('./notificationService');

// Statuts possibles pour une demande
const REQUEST_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Créer un suivi de demande
const createRequestTracking = async (requestId, status, note, userId, isAgent) => {
  try {
    // Vérifier si l'utilisateur est un agent
    if (!isAgent) {
      throw new Error('Seuls les agents peuvent modifier le statut d\'une demande');
    }

    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }

    // Vérifier si l'utilisateur est l'agent assigné à la demande
    if (!request.agent || request.agent.toString() !== userId.toString()) {
      throw new Error('Vous n\'êtes pas l\'agent assigné à cette demande');
    }

    // Ajouter le suivi
    request.tracking.push({
      status,
      note,
      user: userId,
      date: new Date()
    });

    // Mettre à jour le statut
    request.status = status;
    await request.save();

    // Créer une notification
    await createNotification(
      request.user,
      NOTIFICATION_TYPES.REQUEST_UPDATED,
      'Mise à jour de votre demande',
      `Votre demande a été mise à jour : ${status}`,
      { requestId: request._id, status }
    );

    return request;
  } catch (error) {
    throw new Error(`Erreur lors de la création du suivi: ${error.message}`);
  }
};

// Obtenir l'historique des suivis
const getRequestTrackingHistory = async (requestId) => {
  try {
    const request = await Request.findById(requestId)
      .populate('tracking.user', 'firstName lastName email')
      .populate('user', 'firstName lastName email');

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    return request.tracking;
  } catch (error) {
    throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
  }
};

// Obtenir le statut actuel
const getCurrentStatus = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }

    return {
      status: request.status,
      lastUpdate: request.tracking[request.tracking.length - 1]?.date || request.updatedAt
    };
  } catch (error) {
    throw new Error(`Erreur lors de la récupération du statut: ${error.message}`);
  }
};

// Obtenir les statistiques de suivi
const getTrackingStats = async (userId) => {
  try {
    const stats = await Request.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
  }
};

// Obtenir les demandes en attente
const getPendingRequests = async (userId) => {
  try {
    return await Request.find({
      user: userId,
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.PROCESSING] }
    }).sort({ updatedAt: -1 });
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des demandes en attente: ${error.message}`);
  }
};

// Obtenir les demandes complétées
const getCompletedRequests = async (userId) => {
  try {
    return await Request.find({
      user: userId,
      status: REQUEST_STATUS.COMPLETED
    }).sort({ updatedAt: -1 });
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des demandes complétées: ${error.message}`);
  }
};

// Annuler une demande
const cancelRequest = async (requestId, userId, reason) => {
  try {
    const request = await Request.findOne({
      _id: requestId,
      user: userId,
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.PROCESSING] }
    });

    if (!request) {
      throw new Error('Demande non trouvée ou ne peut pas être annulée');
    }

    // Ajouter le suivi
    request.tracking.push({
      status: REQUEST_STATUS.CANCELLED,
      note: `Demande annulée: ${reason}`,
      user: userId,
      date: new Date()
    });

    // Mettre à jour le statut
    request.status = REQUEST_STATUS.CANCELLED;
    await request.save();

    // Créer une notification
    await createNotification(
      request.user,
      NOTIFICATION_TYPES.REQUEST_UPDATED,
      'Demande annulée',
      'Votre demande a été annulée.',
      { requestId: request._id, reason }
    );

    return request;
  } catch (error) {
    throw new Error(`Erreur lors de l'annulation de la demande: ${error.message}`);
  }
};

module.exports = {
  REQUEST_STATUS,
  createRequestTracking,
  getRequestTrackingHistory,
  getCurrentStatus,
  getTrackingStats,
  getPendingRequests,
  getCompletedRequests,
  cancelRequest
}; 