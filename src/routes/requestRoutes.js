const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const Request = require('../models/Request');
const {
  createRequest,
  getRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  getAgentRequests,
  getUserRequests,
  updateRequestStatus,
  getStatistics
} = require('../controllers/requestController');

// Toutes les routes sont protégées
router.use(protect);

// Route pour les statistiques du citoyen
router.get('/statistics', getStatistics);

// Routes pour les citoyens
router.post('/', upload.single('identityDocument'), handleUploadError, createRequest);
router.get('/', getRequests);
router.get('/:id', getRequest);
router.put('/:id', updateRequest);
router.delete('/:id', deleteRequest);

// Routes pour les agents
router.get('/agent/requests', getAgentRequests);
router.put('/:id/status', updateRequestStatus);

module.exports = router; 