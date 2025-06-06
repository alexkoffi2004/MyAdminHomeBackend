const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'myadminhome',
    resource_type: 'auto', // Permet l'upload de tous les types de fichiers
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Configuration de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.'), false);
    }
  }
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  console.error('Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximale : 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur lors de l'upload : ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Une erreur est survenue lors de l\'upload du fichier'
    });
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError
}; 