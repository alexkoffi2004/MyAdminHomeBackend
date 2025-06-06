const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const requestRoutes = require('./requestRoutes');

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des demandes
router.use('/requests', requestRoutes);

module.exports = router; 