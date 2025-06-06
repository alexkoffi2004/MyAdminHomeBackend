const nodemailer = require('nodemailer');
const config = require('../config/config');

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Template pour l'email de confirmation de demande
const getRequestConfirmationTemplate = (request, user) => ({
  subject: 'Confirmation de votre demande',
  html: `
    <h1>Confirmation de demande</h1>
    <p>Cher(e) ${user.firstName} ${user.lastName},</p>
    <p>Nous avons bien reçu votre demande pour un ${request.type}.</p>
    <p>Détails de la demande :</p>
    <ul>
      <li>Type : ${request.type}</li>
      <li>Date de demande : ${new Date(request.createdAt).toLocaleDateString()}</li>
      <li>Statut : ${request.status}</li>
    </ul>
    <p>Nous vous tiendrons informé(e) de l'avancement de votre demande.</p>
    <p>Cordialement,<br>L'équipe MyAdminHome</p>
  `
});

// Template pour l'email de document généré
const getDocumentGeneratedTemplate = (request, user, documentUrl) => ({
  subject: 'Votre document est prêt',
  html: `
    <h1>Votre document est prêt</h1>
    <p>Cher(e) ${user.firstName} ${user.lastName},</p>
    <p>Votre ${request.type} a été généré avec succès.</p>
    <p>Vous pouvez télécharger votre document en cliquant sur le lien ci-dessous :</p>
    <p><a href="${documentUrl}">Télécharger le document</a></p>
    <p>Ce lien est valable pendant 7 jours.</p>
    <p>Cordialement,<br>L'équipe MyAdminHome</p>
  `
});

// Template pour l'email de paiement
const getPaymentConfirmationTemplate = (payment, user) => ({
  subject: 'Confirmation de paiement',
  html: `
    <h1>Confirmation de paiement</h1>
    <p>Cher(e) ${user.firstName} ${user.lastName},</p>
    <p>Nous avons bien reçu votre paiement.</p>
    <p>Détails du paiement :</p>
    <ul>
      <li>Montant : ${payment.amount} ${payment.currency}</li>
      <li>Date : ${new Date(payment.createdAt).toLocaleDateString()}</li>
      <li>Statut : ${payment.status}</li>
    </ul>
    <p>Vous pouvez télécharger votre reçu en cliquant sur le lien ci-dessous :</p>
    <p><a href="${payment.receiptUrl}">Télécharger le reçu</a></p>
    <p>Cordialement,<br>L'équipe MyAdminHome</p>
  `
});

// Envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

// Envoyer un email de confirmation de demande
const sendRequestConfirmation = async (request, user) => {
  try {
    const { subject, html } = getRequestConfirmationTemplate(request, user);
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    throw new Error(`Erreur lors de l'envoi de la confirmation de demande: ${error.message}`);
  }
};

// Envoyer un email de document généré
const sendDocumentGenerated = async (request, user, documentUrl) => {
  try {
    const { subject, html } = getDocumentGeneratedTemplate(request, user, documentUrl);
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    throw new Error(`Erreur lors de l'envoi du document généré: ${error.message}`);
  }
};

// Envoyer un email de confirmation de paiement
const sendPaymentConfirmation = async (payment, user) => {
  try {
    const { subject, html } = getPaymentConfirmationTemplate(payment, user);
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    throw new Error(`Erreur lors de l'envoi de la confirmation de paiement: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
  sendRequestConfirmation,
  sendDocumentGenerated,
  sendPaymentConfirmation
}; 