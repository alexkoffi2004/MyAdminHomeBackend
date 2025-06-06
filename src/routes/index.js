const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const requestRoutes = require('./requestRoutes');
const notificationRoutes = require('./notificationRoutes');

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des demandes
router.use('/requests', requestRoutes);

// Routes de notification
router.use('/notifications', notificationRoutes);

module.exports = router; 