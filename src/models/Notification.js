const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['request_created', 'request_updated', 'request_completed', 'request_rejected', 'payment_received']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour la recherche
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 