const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développement
  console.error(err);

  // Erreur Mongoose - ID invalide
  if (err.name === 'CastError') {
    const message = `Ressource non trouvée`;
    error = new ErrorResponse(message, 404);
  }

  // Erreur Mongoose - Duplication de clé
  if (err.code === 11000) {
    const message = 'Une ressource avec cette valeur existe déjà';
    error = new ErrorResponse(message, 400);
  }

  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token invalide';
    error = new ErrorResponse(message, 401);
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expiré';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur'
  });
};

module.exports = errorHandler; 