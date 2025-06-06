const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// Générer un acte de naissance
const generateBirthCertificate = async (request) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `birth-certificate-${request._id}.pdf`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('RÉPUBLIQUE DU SÉNÉGAL', { align: 'center' });
      doc.fontSize(16).text('ACTE DE NAISSANCE', { align: 'center' });
      doc.moveDown();

      // Informations principales
      doc.fontSize(12).text('Je soussigné(e), Officier d\'état civil de la commune de ' + request.commune + ',');
      doc.moveDown();
      doc.text('certifie que :');
      doc.moveDown();

      // Détails de la personne
      doc.fontSize(12)
        .text(`Nom et prénoms : ${request.fullName}`)
        .text(`Date de naissance : ${new Date(request.birthDate).toLocaleDateString()}`)
        .text(`Lieu de naissance : ${request.birthPlace}`)
        .text(`Nom du père : ${request.fatherName}`)
        .text(`Nom de la mère : ${request.motherName}`);
      doc.moveDown();

      // Pied de page
      doc.fontSize(10)
        .text('Fait à ' + request.commune + ', le ' + new Date().toLocaleDateString(), { align: 'right' })
        .text('Signature et cachet de l\'officier d\'état civil', { align: 'right' });

      // Finaliser le PDF
      doc.end();

      // Upload vers Cloudinary
      stream.on('finish', async () => {
        try {
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'documents',
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

// Générer une déclaration de naissance
const generateBirthDeclaration = async (request) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `birth-declaration-${request._id}.pdf`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('RÉPUBLIQUE DU SÉNÉGAL', { align: 'center' });
      doc.fontSize(16).text('DÉCLARATION DE NAISSANCE', { align: 'center' });
      doc.moveDown();

      // Informations du déclarant
      doc.fontSize(12).text('Je soussigné(e) :');
      doc.moveDown();
      doc.text(`Nom et prénoms du déclarant : ${request.declarantName}`);
      doc.text(`Lien avec l'enfant : ${request.declarantRelation}`);
      doc.moveDown();

      // Détails de l'enfant
      doc.text('Déclare la naissance de :');
      doc.moveDown();
      doc.text(`Nom et prénoms : ${request.fullName}`);
      doc.text(`Date de naissance : ${new Date(request.birthDate).toLocaleDateString()}`);
      doc.text(`Lieu de naissance : ${request.birthPlace}`);
      doc.text(`Nom du père : ${request.fatherName}`);
      doc.text(`Nom de la mère : ${request.motherName}`);
      doc.moveDown();

      // Pied de page
      doc.fontSize(10)
        .text('Fait à ' + request.commune + ', le ' + new Date().toLocaleDateString(), { align: 'right' })
        .text('Signature du déclarant', { align: 'right' });

      // Finaliser le PDF
      doc.end();

      // Upload vers Cloudinary
      stream.on('finish', async () => {
        try {
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'documents',
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

// Générer un acte de décès
const generateDeathCertificate = async (request) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const fileName = `death-certificate-${request._id}.pdf`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('RÉPUBLIQUE DU SÉNÉGAL', { align: 'center' });
      doc.fontSize(16).text('ACTE DE DÉCÈS', { align: 'center' });
      doc.moveDown();

      // Informations principales
      doc.fontSize(12).text('Je soussigné(e), Officier d\'état civil de la commune de ' + request.commune + ',');
      doc.moveDown();
      doc.text('certifie que :');
      doc.moveDown();

      // Détails du défunt
      doc.fontSize(12)
        .text(`Nom et prénoms : ${request.fullName}`)
        .text(`Date de décès : ${new Date(request.deathDate).toLocaleDateString()}`)
        .text(`Lieu de décès : ${request.deathPlace}`)
        .text(`Cause du décès : ${request.deathCause}`);
      doc.moveDown();

      // Pied de page
      doc.fontSize(10)
        .text('Fait à ' + request.commune + ', le ' + new Date().toLocaleDateString(), { align: 'right' })
        .text('Signature et cachet de l\'officier d\'état civil', { align: 'right' });

      // Finaliser le PDF
      doc.end();

      // Upload vers Cloudinary
      stream.on('finish', async () => {
        try {
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'documents',
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

// Fonction principale pour générer un document
const generateDocument = async (request) => {
  try {
    let document;
    switch (request.documentType) {
      case 'birth_certificate':
        document = await generateBirthCertificate(request);
        break;
      case 'birth_declaration':
        document = await generateBirthDeclaration(request);
        break;
      case 'death_certificate':
        document = await generateDeathCertificate(request);
        break;
      default:
        throw new Error('Type de document non supporté');
    }

    return document;
  } catch (error) {
    throw new Error(`Erreur lors de la génération du document: ${error.message}`);
  }
};

module.exports = {
  generateDocument,
  generateBirthCertificate,
  generateBirthDeclaration,
  generateDeathCertificate
};