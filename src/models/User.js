const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Veuillez fournir un prénom'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Veuillez fournir un numéro de téléphone']
  },
  address: {
    type: String,
    required: [true, 'Veuillez fournir une adresse']
  },
  role: {
    type: String,
    enum: ['citizen', 'agent', 'admin'],
    default: 'citizen'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  commune: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commune',
    required: function() {
      return this.role === 'agent';
    }
  },
  maxDailyRequests: {
    type: Number,
    default: 20,
    required: function() {
      return this.role === 'agent';
    }
  },
  dailyRequestCount: {
    type: Number,
    default: 0
  },
  lastRequestCountReset: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypter le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Reset daily request count at midnight
UserSchema.pre('save', function(next) {
  if (this.role === 'agent') {
    const now = new Date();
    const lastReset = new Date(this.lastRequestCountReset);
    
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      this.dailyRequestCount = 0;
      this.lastRequestCountReset = now;
    }
  }
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparaison des mots de passe...');
  console.log('Mot de passe entré:', enteredPassword);
  console.log('Mot de passe hashé:', this.password);
  
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Résultat de la comparaison:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Erreur lors de la comparaison des mots de passe:', error);
    throw error;
  }
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Check if agent can accept more requests
UserSchema.methods.canAcceptMoreRequests = function() {
  if (this.role !== 'agent') return false;
  return this.dailyRequestCount < this.maxDailyRequests;
};

// Increment daily request count
UserSchema.methods.incrementRequestCount = async function() {
  if (this.role === 'agent') {
    this.dailyRequestCount += 1;
    await this.save();
  }
};

// Check if user is super admin
UserSchema.methods.isSuperAdmin = function() {
  return this.role === 'admin';
};

module.exports = mongoose.model('User', UserSchema); 