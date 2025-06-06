const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    required: [true, 'Le type de document est requis'],
    enum: ['birth_certificate', 'death_certificate', 'birth_declaration', 'identity_document']
  },
  status: {
    type: String,
    enum: ['en_attente', 'en_cours', 'terminee', 'rejetee'],
    default: 'en_attente'
  },
  commune: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commune',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Informations personnelles
  fullName: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  birthPlace: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  motherName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: String,
  // Méthode de livraison
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  // Documents spécifiques selon le type
  documents: {
    oldBirthCertificate: String,
    deathCertificate: String,
    deathMedicalCertificate: String,
    deceasedIdentityDocument: String,
    identityDocument: String
  },
  // Informations spécifiques pour les certificats de décès
  deathInfo: {
    deathDate: Date,
    deathPlace: String,
    deathCause: String
  },
  // Informations spécifiques pour les déclarations de naissance
  birthDeclarationInfo: {
    declarantName: String,
    declarantRelation: String
  },
  // Suivi de la demande
  tracking: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index pour la recherche
requestSchema.index({ citizen: 1, status: 1 });
requestSchema.index({ documentType: 1, status: 1 });
requestSchema.index({ commune: 1, status: 1 });
requestSchema.index({ 'tracking.submittedAt': -1 });

module.exports = mongoose.model('Request', requestSchema); 