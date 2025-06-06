const User = require('../models/User');
const { catchAsync } = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');

// Générer un token JWT
const generateToken = (userId) => {
  console.log('Génération du token pour l\'utilisateur:', userId);
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
  console.log('Token généré:', token);
  return token;
};

// @desc    Inscription d'un citoyen
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res) => {
  console.log('=== Début de l\'inscription ===');
  console.log('Données d\'inscription reçues:', req.body);
  
  const { firstName, lastName, email, password, phone, address } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log('Email déjà utilisé:', email);
    return res.status(400).json({
      success: false,
      message: 'Cet email est déjà utilisé'
    });
  }

  try {
    // Créer le nouvel utilisateur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role: 'citizen' // Rôle par défaut pour les inscriptions
    });

    console.log('Utilisateur créé avec succès:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Générer le token
    const token = generateToken(user._id);

    // Retourner la réponse
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
});

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res) => {
  console.log('=== Début de la connexion ===');
  console.log('Données de connexion reçues:', req.body);
  
  const { email, password } = req.body;

  // Vérifier si l'email et le mot de passe sont fournis
  if (!email || !password) {
    console.log('Email ou mot de passe manquant');
    return res.status(400).json({
      success: false,
      message: 'Veuillez fournir un email et un mot de passe'
    });
  }

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    console.log('Utilisateur trouvé:', user ? {
      id: user._id,
      email: user.email,
      role: user.role
    } : 'Non');

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le mot de passe est correct
    console.log('Vérification du mot de passe...');
    const isMatch = await user.matchPassword(password);
    console.log('Mot de passe correct:', isMatch ? 'Oui' : 'Non');

    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user._id);
    console.log('Connexion réussie pour l\'utilisateur:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res) => {
  console.log('=== Récupération des informations utilisateur ===');
  console.log('ID utilisateur:', req.user.id);
  
  const user = await User.findById(req.user.id);
  console.log('Utilisateur trouvé:', user ? {
    id: user._id,
    email: user.email,
    role: user.role
  } : 'Non');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address, commune } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (commune) user.commune = commune;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        commune: user.commune
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 