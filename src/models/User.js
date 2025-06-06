const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: {
    type: String,
    enum: ['citizen', 'agent', 'super_admin'],
    default: 'citizen'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Reset daily request count at midnight
userSchema.pre('save', function(next) {
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

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if agent can accept more requests
userSchema.methods.canAcceptMoreRequests = function() {
  if (this.role !== 'agent') return false;
  return this.dailyRequestCount < this.maxDailyRequests;
};

// Increment daily request count
userSchema.methods.incrementRequestCount = async function() {
  if (this.role === 'agent') {
    this.dailyRequestCount += 1;
    await this.save();
  }
};

// Check if user is super admin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

module.exports = mongoose.model('User', userSchema); 