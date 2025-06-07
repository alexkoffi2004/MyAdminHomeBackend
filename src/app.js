const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const path = require('path');

// Routes
const routes = require('./routes');
const webhookRoutes = require('./routes/webhookRoutes');

// Middleware d'erreur
const errorHandler = require('./middleware/error');

// Initialisation de l'application
const app = express();

// Sécurité
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Limiter les requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api', limiter);

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Configuration spéciale pour les webhooks Stripe
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', webhookRoutes);

// Middleware pour les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Upload de fichiers
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true
}));

// Routes
app.use('/api', routes);

// Gestion des erreurs
app.use(errorHandler);

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`
  });
});

module.exports = app; 