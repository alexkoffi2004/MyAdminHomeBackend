const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Request = require('../models/Request');

// Créer une intention de paiement
const createPaymentIntent = async ({ amount, currency = 'XOF', requestId, userId }) => {
  try {
    // S'assurer que le montant est un nombre entier
    const amountInCents = Math.round(Number(amount) * 100);
    
    if (isNaN(amountInCents)) {
      throw new Error('Le montant doit être un nombre valide');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      payment_method_types: ['card'],
      metadata: {
        requestId: requestId.toString(),
        userId: userId.toString(),
        integration_check: 'accept_a_payment'
      }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
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

    // Mettre à jour le statut de paiement dans la demande associée
    if (payment && payment.request) {
      await Request.findByIdAndUpdate(
        payment.request,
        {
          paymentStatus: status === 'succeeded' ? 'completed' : status,
          'payment.status': status === 'succeeded' ? 'paid' : status,
          'payment.transactionId': stripePaymentId,
          'payment.date': new Date()
        }
      );
    }

    return payment;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du statut du paiement: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  savePayment,
  updatePaymentStatus
}; 