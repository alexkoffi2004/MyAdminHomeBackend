const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['birth_certificate', 'birth_declaration', 'death_certificate'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  commune: {
    type: String,
    required: true
  },
  // Informations personnelles
  fullName: {
    type: String,
    required: true
  },
  birthDate: Date,
  birthPlace: String,
  fatherName: String,
  motherName: String,
  // Pour déclaration de naissance
  declarantName: String,
  declarantRelation: String,
  // Pour acte de décès
  deathDate: Date,
  deathPlace: String,
  deathCause: String,
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['oldBirthCertificate', 'deathCertificate', 'identityDocument']
    },
    url: String,
    publicId: String
  }],
  // Livraison
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  address: String,
  phoneNumber: String,
  // Paiement
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // Prix
  documentPrice: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  // Suivi
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Document généré
  generatedDocument: {
    url: String,
    publicId: String
  }
}, {
  timestamps: true
});

// Index pour la recherche
requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ documentType: 1, status: 1 });
requestSchema.index({ commune: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema); 