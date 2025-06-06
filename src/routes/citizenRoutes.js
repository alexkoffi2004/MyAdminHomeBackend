const express = require('express');
const router = express.Router();
const { protect, isCitizen } = require('../middleware/auth');
const { getStats, getRecentPayments } = require('../controllers/citizenController');
const { getUserRequests, getRequest } = require('../controllers/requestController');

// Routes protégées pour les citoyens
router.get('/statistics', protect, isCitizen, getStats);
router.get('/statistics/payments', protect, isCitizen, getRecentPayments);
router.get('/requests', protect, isCitizen, getUserRequests);
router.get('/requests/:id', protect, isCitizen, getRequest);

module.exports = router; 