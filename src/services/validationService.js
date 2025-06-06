const Request = require('../models/Request');
const { NOTIFICATION_TYPES } = require('./notificationService');
const { createNotification } = require('./notificationService');

// Types de documents
const DOCUMENT_TYPES = {
  BIRTH_CERTIFICATE: 'birth_certificate',
  DEATH_CERTIFICATE: 'death_certificate',
  DECLARATION: 'declaration'
};

// Règles de validation par type de document
const VALIDATION_RULES = {
  [DOCUMENT_TYPES.BIRTH_CERTIFICATE]: {
    requiredFields: [
      'firstName',
      'lastName',
      'dateOfBirth',
      'placeOfBirth',
      'fatherName',
      'motherName'
    ],
    validateFields: {
      dateOfBirth: (date) => new Date(date) < new Date(),
      placeOfBirth: (place) => place.length >= 3
    }
  },
  [DOCUMENT_TYPES.DEATH_CERTIFICATE]: {
    requiredFields: [
      'deceasedFirstName',
      'deceasedLastName',
      'dateOfDeath',
      'placeOfDeath',
      'causeOfDeath'
    ],
    validateFields: {
      dateOfDeath: (date) => new Date(date) < new Date(),
      placeOfDeath: (place) => place.length >= 3
    }
  },
  [DOCUMENT_TYPES.DECLARATION]: {
    requiredFields: [
      'declarantFirstName',
      'declarantLastName',
      'declarationType',
      'declarationDate',
      'declarationContent'
    ],
    validateFields: {
      declarationDate: (date) => new Date(date) < new Date(),
      declarationContent: (content) => content.length >= 50
    }
  }
};

// Valider un document
const validateDocument = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }

    const rules = VALIDATION_RULES[request.type];
    if (!rules) {
      throw new Error('Type de document non supporté');
    }

    const validationErrors = [];

    // Vérifier les champs requis
    for (const field of rules.requiredFields) {
      if (!request.data[field]) {
        validationErrors.push(`Le champ ${field} est requis`);
      }
    }

    // Valider les champs selon les règles spécifiques
    for (const [field, validator] of Object.entries(rules.validateFields)) {
      if (request.data[field] && !validator(request.data[field])) {
        validationErrors.push(`Le champ ${field} n'est pas valide`);
      }
    }

    // Mettre à jour le statut de la demande
    if (validationErrors.length === 0) {
      request.status = 'validated';
      await request.save();

      // Créer une notification
      await createNotification(
        request.user,
        NOTIFICATION_TYPES.REQUEST_UPDATED,
        'Document validé',
        'Votre document a été validé avec succès.',
        { requestId: request._id }
      );

      return {
        valid: true,
        message: 'Document validé avec succès'
      };
    } else {
      request.status = 'rejected';
      request.validationErrors = validationErrors;
      await request.save();

      // Créer une notification
      await createNotification(
        request.user,
        NOTIFICATION_TYPES.REQUEST_UPDATED,
        'Document rejeté',
        'Votre document a été rejeté. Veuillez corriger les erreurs.',
        { requestId: request._id, errors: validationErrors }
      );

      return {
        valid: false,
        errors: validationErrors
      };
    }
  } catch (error) {
    throw new Error(`Erreur lors de la validation du document: ${error.message}`);
  }
};

// Vérifier si un document est valide
const isDocumentValid = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }

    return request.status === 'validated';
  } catch (error) {
    throw new Error(`Erreur lors de la vérification du document: ${error.message}`);
  }
};

// Obtenir les erreurs de validation
const getValidationErrors = async (requestId) => {
  try {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }

    return request.validationErrors || [];
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des erreurs de validation: ${error.message}`);
  }
};

module.exports = {
  DOCUMENT_TYPES,
  validateDocument,
  isDocumentValid,
  getValidationErrors
}; 