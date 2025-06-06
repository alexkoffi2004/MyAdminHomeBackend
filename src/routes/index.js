const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const requestRoutes = require('./requestRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const citizenRoutes = require('./citizenRoutes');
const agentRoutes = require('./agentRoutes');

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des demandes
router.use('/requests', requestRoutes);

// Routes de notification
router.use('/notifications', notificationRoutes);

// Routes d'administration
router.use('/admin', adminRoutes);

// Routes de citoyen
router.use('/citizen', citizenRoutes);

// Routes d'agent
router.use('/agent', agentRoutes);

module.exports = router; 