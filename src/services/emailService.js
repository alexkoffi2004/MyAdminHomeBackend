const nodemailer = require('nodemailer');

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

// Email de confirmation de demande
const sendRequestConfirmationEmail = async (user, request) => {
  const subject = 'Confirmation de votre demande';
  const html = `
    <h1>Confirmation de demande</h1>
    <p>Bonjour ${user.fullName},</p>
    <p>Votre demande de ${request.documentType} a été reçue avec succès.</p>
    <p>Numéro de demande: ${request._id}</p>
    <p>Nous vous tiendrons informé de l'avancement de votre demande.</p>
  `;

  return sendEmail(user.email, subject, html);
};

// Email de mise à jour de statut
const sendStatusUpdateEmail = async (user, request) => {
  const subject = 'Mise à jour de votre demande';
  const html = `
    <h1>Mise à jour de demande</h1>
    <p>Bonjour ${user.fullName},</p>
    <p>Le statut de votre demande de ${request.documentType} a été mis à jour.</p>
    <p>Nouveau statut: ${request.status}</p>
    <p>Numéro de demande: ${request._id}</p>
  `;

  return sendEmail(user.email, subject, html);
};

// Email de document prêt
const sendDocumentReadyEmail = async (user, request) => {
  const subject = 'Votre document est prêt';
  const html = `
    <h1>Document prêt</h1>
    <p>Bonjour ${user.fullName},</p>
    <p>Votre ${request.documentType} est prêt.</p>
    <p>Numéro de demande: ${request._id}</p>
    <p>Vous pouvez le récupérer à la mairie ou le télécharger depuis votre espace personnel.</p>
  `;

  return sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendRequestConfirmationEmail,
  sendStatusUpdateEmail,
  sendDocumentReadyEmail
}; 