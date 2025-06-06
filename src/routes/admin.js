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

// Toutes les routes admin nécessitent d'être authentifié et d'être super_admin
router.use(protect);
router.use(authorize('super_admin'));

router.route('/agents')
  .post(createAgent)
  .get(getAgents);

router.route('/agents/:id')
  .get(getAgent)
  .put(updateAgent)
  .delete(deleteAgent);

module.exports = router; 