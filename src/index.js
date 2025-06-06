const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.post('/api/requests', upload.fields([
  { name: 'oldBirthCertificate', maxCount: 1 },
  { name: 'deathCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    // Ici, nous allons traiter la demande
    const formData = req.body;
    const files = req.files;

    // Pour l'instant, nous renvoyons juste une réponse de succès
    res.status(201).json({
      message: 'Demande créée avec succès',
      data: {
        ...formData,
        files: files
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la demande',
      error: error.message
    });
  }
});

// Créer le dossier uploads s'il n'existe pas
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
}); 