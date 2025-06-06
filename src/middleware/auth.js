const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé à accéder à cette route'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id);
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette route`,
          403
        )
      );
    }
    next();
  };
};

// Middleware spécifique pour les citoyens
exports.isCitizen = (req, res, next) => {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux citoyens'
    });
  }
  next();
};

// Middleware spécifique pour les agents
exports.isAgent = (req, res, next) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux agents'
    });
  }
  next();
};

// Middleware spécifique pour les admins
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
}; 