const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const { generateReceipt } = require('./pdfService');

// Créer une intention de paiement
const createPaymentIntent = async (amount, currency = 'XOF') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe utilise les centimes
      currency: currency,
      payment_method_types: ['card', 'mobile_money'],
      metadata: {
        integration_check: 'accept_a_payment'
      }
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Erreur lors de la création de l'intention de paiement: ${error.message}`);
  }
};

// Confirmer un paiement
const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`);
  }
};

// Créer un client Stripe
const createCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        integration_check: 'accept_a_payment'
      }
    });
    return customer;
  } catch (error) {
    throw new Error(`Erreur lors de la création du client: ${error.message}`);
  }
};

// Enregistrer un paiement dans la base de données
const savePayment = async (paymentData) => {
  try {
    const payment = await Payment.create(paymentData);
    return payment;
  } catch (error) {
    throw new Error(`Erreur lors de l'enregistrement du paiement: ${error.message}`);
  }
};

// Mettre à jour le statut d'un paiement
const updatePaymentStatus = async (paymentId, status, stripePaymentId) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status,
        stripePaymentId,
        $set: {
          'paymentDetails.status': status
        }
      },
      { new: true }
    );
    return payment;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du statut du paiement: ${error.message}`);
  }
};

// Traiter un paiement réussi
const handleSuccessfulPayment = async (paymentId, requestId) => {
  try {
    // Mettre à jour le statut du paiement
    const payment = await updatePaymentStatus(paymentId, 'succeeded');

    // Générer le reçu
    const receipt = await generateReceipt(payment);

    // Mettre à jour le paiement avec l'URL du reçu
    await Payment.findByIdAndUpdate(paymentId, {
      receiptUrl: receipt.url
    });

    return {
      payment,
      receipt
    };
  } catch (error) {
    throw new Error(`Erreur lors du traitement du paiement: ${error.message}`);
  }
};

// Rembourser un paiement
const refundPayment = async (paymentId, amount) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: amount * 100 // Stripe utilise les centimes
    });

    // Mettre à jour le statut du paiement
    await updatePaymentStatus(paymentId, 'refunded');

    return refund;
  } catch (error) {
    throw new Error(`Erreur lors du remboursement: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  savePayment,
  updatePaymentStatus,
  handleSuccessfulPayment,
  refundPayment
};