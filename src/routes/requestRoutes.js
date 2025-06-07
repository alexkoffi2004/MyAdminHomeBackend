const express = require('express');
const router = express.Router();
const { protect, isCitizen, isAgent, isAdmin } = require('../middleware/auth');
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
  getStatistics,
  processRequest,
  initializePayment,
  updatePaymentStatus
} = require('../controllers/requestController');

// Toutes les routes sont protégées
router.use(protect);

// Route pour les statistiques du citoyen
router.get('/statistics', isCitizen, getStatistics);

// Routes pour les citoyens
router.post('/', isCitizen, upload.single('identityDocument'), handleUploadError, createRequest);
router.get('/', isCitizen, getRequests);
router.get('/:id', getRequest);
router.put('/:id', isCitizen, updateRequest);
router.delete('/:id', isCitizen, deleteRequest);
router.post('/:id/payment', isCitizen, initializePayment);
router.post('/:id/payment-status', updatePaymentStatus);

// Routes pour les agents
router.get('/agent/requests', isAgent, getAgentRequests);
router.put('/:id/status', isAgent, updateRequestStatus);
router.put('/:id/process', isAgent, processRequest);

module.exports = router; 