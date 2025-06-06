const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRequest,
  getUserRequests,
  getRequest,
  updateRequestStatus,
  getAllRequests
} = require('../controllers/requestController');

// Routes protégées (nécessitent une authentification)
router.use(protect);

// Routes pour les citoyens
router.route('/')
  .post(createRequest)
  .get(getUserRequests);

router.route('/:id')
  .get(getRequest);

// Routes pour les agents et admins
router.route('/all')
  .get(authorize('agent', 'admin'), getAllRequests);

router.route('/:id/status')
  .put(authorize('agent', 'admin'), updateRequestStatus);

module.exports = router; 