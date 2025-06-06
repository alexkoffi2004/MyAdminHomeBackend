// Wrapper pour gérer les erreurs asynchrones
exports.catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Middleware de gestion des erreurs
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développement
  console.error(err);

  // Erreur MongoDB - ID invalide
  if (err.name === 'CastError') {
    const message = 'Ressource non trouvée';
    error = { message, statusCode: 404 };
  }

  // Erreur MongoDB - Duplicate key
  if (err.code === 11000) {
    const message = 'Une ressource avec cette valeur existe déjà';
    error = { message, statusCode: 400 };
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur'
  });
}; 