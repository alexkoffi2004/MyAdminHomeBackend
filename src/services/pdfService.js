const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Générer un acte de naissance
const generateBirthCertificate = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `birth_certificate_${data._id}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('ACTE DE NAISSANCE', { align: 'center' });
      doc.moveDown();

      // Informations
      doc.fontSize(12);
      doc.text(`Nom et prénoms: ${data.fullName}`);
      doc.text(`Date de naissance: ${new Date(data.birthDate).toLocaleDateString()}`);
      doc.text(`Lieu de naissance: ${data.birthPlace}`);
      doc.text(`Nom du père: ${data.fatherName}`);
      doc.text(`Nom de la mère: ${data.motherName}`);
      doc.moveDown();

      // Signature
      doc.text('Signature et cachet de l\'officier d\'état civil', { align: 'right' });
      doc.moveDown();
      doc.text(`Date de délivrance: ${new Date().toLocaleDateString()}`);

      doc.end();

      stream.on('finish', () => {
        resolve({
          fileName,
          filePath
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un certificat de décès
const generateDeathCertificate = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `death_certificate_${data._id}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('CERTIFICAT DE DECES', { align: 'center' });
      doc.moveDown();

      // Informations
      doc.fontSize(12);
      doc.text(`Nom et prénoms du défunt: ${data.fullName}`);
      doc.text(`Date de décès: ${new Date(data.deathInfo.deathDate).toLocaleDateString()}`);
      doc.text(`Lieu de décès: ${data.deathInfo.deathPlace}`);
      doc.text(`Cause du décès: ${data.deathInfo.deathCause}`);
      doc.moveDown();

      // Signature
      doc.text('Signature et cachet de l\'officier d\'état civil', { align: 'right' });
      doc.moveDown();
      doc.text(`Date de délivrance: ${new Date().toLocaleDateString()}`);

      doc.end();

      stream.on('finish', () => {
        resolve({
          fileName,
          filePath
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un reçu de paiement
const generateReceipt = async (payment, request, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `receipt-${payment._id}.pdf`;
      const filePath = path.join(__dirname, '../../uploads', fileName);

      // Créer le stream d'écriture
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('Reçu de Paiement', { align: 'center' });
      doc.moveDown();

      // Informations de la demande
      doc.fontSize(12).text('Détails de la demande:');
      doc.fontSize(10)
        .text(`Type de document: ${request.documentType}`)
        .text(`Commune: ${request.commune}`)
        .text(`Nom: ${request.fullName}`)
        .text(`Date de la demande: ${request.createdAt.toLocaleDateString()}`);
      doc.moveDown();

      // Informations de paiement
      doc.fontSize(12).text('Détails du paiement:');
      doc.fontSize(10)
        .text(`Montant: ${payment.amount} ${payment.currency}`)
        .text(`Méthode de paiement: ${payment.paymentMethod}`)
        .text(`Statut: ${payment.status}`)
        .text(`Date du paiement: ${payment.createdAt.toLocaleDateString()}`);
      doc.moveDown();

      // Informations du client
      doc.fontSize(12).text('Informations client:');
      doc.fontSize(10)
        .text(`Nom: ${user.firstName} ${user.lastName}`)
        .text(`Email: ${user.email}`)
        .text(`Téléphone: ${user.phoneNumber || 'Non renseigné'}`);
      doc.moveDown();

      // Pied de page
      doc.fontSize(8)
        .text('Ce document est un reçu officiel de paiement.', { align: 'center' })
        .text('Merci de votre confiance.', { align: 'center' });

      // Finaliser le PDF
      doc.end();

      // Attendre que le fichier soit créé
      stream.on('finish', async () => {
        try {
          // Upload vers Cloudinary
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'receipts',
            resource_type: 'raw'
          });

          // Supprimer le fichier local
          fs.unlinkSync(filePath);

          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceipt,
  generateBirthCertificate,
  generateDeathCertificate
}; 