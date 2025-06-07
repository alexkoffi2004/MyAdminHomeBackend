const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documentType: {
    type: String,
    required: [true, 'Le type de document est requis'],
    enum: [
      'birth_certificate',
      'marriage_certificate',
      'death_certificate',
      'nationality_certificate',
      'residence_certificate',
      'criminal_record'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  commune: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commune',
    required: [true, 'La commune est requise']
  },
  // Informations personnelles
  fullName: {
    type: String,
    required: [true, 'Le nom complet est requis']
  },
  birthDate: {
    type: Date,
    required: [true, 'La date de naissance est requise']
  },
  birthPlace: {
    type: String,
    required: [true, 'Le lieu de naissance est requis']
  },
  fatherName: {
    type: String
  },
  motherName: {
    type: String
  },
  // Informations de contact
  phoneNumber: {
    type: String
  },
  address: {
    type: String
  },
  // Méthode de livraison
  deliveryMethod: {
    type: String,
    enum: ['download', 'pickup', 'delivery'],
    required: [true, 'La méthode de livraison est requise']
  },
  // Document d'identité
  identityDocument: {
    type: String,
    required: [true, 'Le document d\'identité est requis']
  },
  // Prix et paiement
  price: {
    type: Number,
    required: true
  },
  paymentIntentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['card', 'mobile_money', 'bank_transfer'],
      default: 'card'
    },
    transactionId: String
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
  // Notes et commentaires
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
  }]
}, {
  timestamps: true
});

// Index pour la recherche
requestSchema.index({ user: 1, status: 1 });
requestSchema.index({ documentType: 1, status: 1 });
requestSchema.index({ commune: 1, status: 1 });
requestSchema.index({ 'tracking.submittedAt': -1 });

module.exports = mongoose.model('Request', requestSchema); 