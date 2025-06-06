const User = require('../models/User');
const Commune = require('../models/Commune');
const { NOTIFICATION_TYPES } = require('./notificationService');
const { createNotification } = require('./notificationService');

// Trouver un agent disponible pour une commune
const findAvailableAgent = async (communeId) => {
  try {
    console.log('Recherche d\'un agent disponible pour la commune:', communeId);
    
    // Trouver tous les agents actifs de la commune
    const agents = await User.find({
      role: 'agent',
      commune: communeId,
      isActive: true
    });

    console.log('Nombre d\'agents trouvés:', agents.length);
    console.log('Agents trouvés:', agents.map(a => ({ id: a._id, commune: a.commune })));

    if (agents.length === 0) {
      throw new Error('Aucun agent disponible pour cette commune');
    }

    // Filtrer les agents qui peuvent accepter plus de demandes
    const availableAgents = agents.filter(agent => agent.canAcceptMoreRequests());
    console.log('Nombre d\'agents disponibles:', availableAgents.length);

    if (availableAgents.length === 0) {
      throw new Error('Tous les agents de cette commune ont atteint leur limite quotidienne');
    }

    // Sélectionner l'agent avec le moins de demandes
    const selectedAgent = availableAgents.reduce((prev, current) => 
      (prev.dailyRequestCount < current.dailyRequestCount) ? prev : current
    );
    console.log('Agent sélectionné:', { id: selectedAgent._id, commune: selectedAgent.commune });

    return selectedAgent;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'un agent disponible:', error);
    throw new Error(`Erreur lors de la recherche d'un agent disponible: ${error.message}`);
  }
};

// Assigner une demande à un agent
const assignRequestToAgent = async (requestId, communeId) => {
  try {
    console.log('Assignation de la demande', requestId, 'à un agent de la commune', communeId);
    
    const agent = await findAvailableAgent(communeId);
    console.log('Agent trouvé pour l\'assignation:', { id: agent._id, commune: agent.commune });
    
    // Incrémenter le compteur de demandes de l'agent
    await agent.incrementRequestCount();

    // Créer une notification pour l'agent
    await createNotification({
      user: agent._id,
      type: NOTIFICATION_TYPES.REQUEST_ASSIGNED,
      title: 'Nouvelle demande assignée',
      message: 'Une nouvelle demande vous a été assignée.',
      request: requestId
    });

    return agent;
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la demande:', error);
    throw new Error(`Erreur lors de l'assignation de la demande: ${error.message}`);
  }
};

// Obtenir les statistiques des agents d'une commune
const getCommuneAgentStats = async (communeId) => {
  try {
    const agents = await User.find({
      role: 'agent',
      commune: communeId
    }).select('firstName lastName dailyRequestCount maxDailyRequests isActive');

    return agents.map(agent => ({
      id: agent._id,
      name: `${agent.firstName} ${agent.lastName}`,
      dailyRequests: agent.dailyRequestCount,
      maxDailyRequests: agent.maxDailyRequests,
      isActive: agent.isActive,
      availableRequests: agent.maxDailyRequests - agent.dailyRequestCount
    }));
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
  }
};

// Réassigner une demande à un autre agent
const reassignRequest = async (requestId, currentAgentId, communeId) => {
  try {
    // Trouver un nouvel agent disponible
    const newAgent = await findAvailableAgent(communeId);

    // Vérifier que ce n'est pas le même agent
    if (newAgent._id.toString() === currentAgentId.toString()) {
      throw new Error('Aucun autre agent disponible pour la réassignation');
    }

    // Incrémenter le compteur de demandes du nouvel agent
    await newAgent.incrementRequestCount();

    // Créer une notification pour le nouvel agent
    await createNotification(
      newAgent._id,
      NOTIFICATION_TYPES.REQUEST_REASSIGNED,
      'Demande réassignée',
      'Une demande vous a été réassignée.',
      { requestId }
    );

    return newAgent;
  } catch (error) {
    throw new Error(`Erreur lors de la réassignation de la demande: ${error.message}`);
  }
};

module.exports = {
  findAvailableAgent,
  assignRequestToAgent,
  getCommuneAgentStats,
  reassignRequest
}; 