const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'myadminhome',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Configuration de Multer
const upload = multer({ storage: storage });

// Fonction pour supprimer un fichier de Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
  }
};

// Fonction pour uploader un fichier
const uploadFile = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'myadminhome',
      resource_type: 'auto'
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    throw new Error(`Erreur lors de l'upload du fichier: ${error.message}`);
  }
};

module.exports = {
  upload,
  deleteFile,
  uploadFile
}; 