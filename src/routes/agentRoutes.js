const express = require('express');
const router = express.Router();
const { protect, isAgent } = require('../middleware/auth');
const { getStats, getPendingRequests } = require('../controllers/agentController');

// Routes protégées pour les agents
router.get('/statistics', protect, isAgent, getStats);
router.get('/statistics/pending-requests', protect, isAgent, getPendingRequests);

module.exports = router; 