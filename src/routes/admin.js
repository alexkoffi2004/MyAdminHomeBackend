const express = require('express');
const router = express.Router();
const {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  deleteAgent
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes admin nécessitent d'être authentifié et d'être admin
router.use(protect);
router.use(authorize('admin'));

// Routes pour la gestion des agents
router.post('/agents', createAgent);
router.get('/agents', getAgents);
router.get('/agents/:id', getAgent);
router.put('/agents/:id', updateAgent);
router.delete('/agents/:id', deleteAgent);

module.exports = router; 