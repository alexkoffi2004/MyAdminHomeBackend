const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'XOF'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  stripePaymentId: String,
  stripeCustomerId: String,
  receiptUrl: String,
  paymentMethod: {
    type: String,
    enum: ['card', 'mobile_money'],
    required: true
  },
  paymentDetails: {
    type: Object
  }
}, {
  timestamps: true
});

// Index pour la recherche
paymentSchema.index({ request: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema); 