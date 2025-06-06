const mongoose = require('mongoose');

const communeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la commune est requis'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    required: [true, 'La région est requise'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Le département est requis'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Statistiques
  totalRequests: {
    type: Number,
    default: 0
  },
  completedRequests: {
    type: Number,
    default: 0
  },
  pendingRequests: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour la recherche
communeSchema.index({ name: 1, region: 1, department: 1 });

module.exports = mongoose.model('Commune', communeSchema); 