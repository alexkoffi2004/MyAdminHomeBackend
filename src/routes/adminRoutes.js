const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getRecentPayments,
  getUsers,
  updateUser,
  deleteUser,
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  deleteAgent
} = require('../controllers/adminController');

// Middleware de logging pour les routes admin
router.use((req, res, next) => {
  console.log('Route admin accédée:', req.method, req.originalUrl);
  next();
});

// Toutes les routes nécessitent d'être authentifié et d'être admin
router.use(protect);
router.use(authorize('admin'));

// Routes de statistiques
router.get('/stats', getStats);
router.get('/payments/recent', getRecentPayments);

// Routes de gestion des utilisateurs
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Routes de gestion des agents
router.post('/agents', createAgent);
router.get('/agents', getAgents);
router.get('/agents/:id', getAgent);
router.put('/agents/:id', updateAgent);
router.delete('/agents/:id', deleteAgent);

module.exports = router; 