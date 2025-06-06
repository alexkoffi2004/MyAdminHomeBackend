const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCitizenStats } = require('../controllers/statisticsController');

// Statistics routes
router.get('/statistics', protect, getCitizenStats);

// ... existing routes ...

module.exports = router; 