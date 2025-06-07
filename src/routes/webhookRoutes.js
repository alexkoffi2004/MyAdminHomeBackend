const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { updatePaymentStatus } = require('../services/stripeService');
const Request = require('../models/Request');

// Middleware pour vérifier la signature du webhook Stripe
const verifyStripeWebhook = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Route pour recevoir les webhooks Stripe
router.post('/stripe', express.raw({ type: 'application/json' }), verifyStripeWebhook, async (req, res) => {
  const event = req.stripeEvent;

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const requestId = paymentIntent.metadata.requestId;

        // Mettre à jour uniquement les informations de paiement
        await Request.findByIdAndUpdate(requestId, {
          paymentStatus: 'completed',
          'payment.status': 'paid',
          'payment.transactionId': paymentIntent.id,
          'payment.date': new Date()
        });

        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedRequestId = failedPayment.metadata.requestId;

        // Mettre à jour uniquement les informations de paiement
        await Request.findByIdAndUpdate(failedRequestId, {
          paymentStatus: 'failed',
          'payment.status': 'failed',
          'payment.transactionId': failedPayment.id,
          'payment.date': new Date()
        });

        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

module.exports = router; 