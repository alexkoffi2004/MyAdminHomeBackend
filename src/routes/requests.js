const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getRequest,
  updateRequest,
  deleteRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

router.route('/')
  .post(createRequest)
  .get(getMyRequests);

router.route('/:id')
  .get(getRequest)
  .put(updateRequest)
  .delete(deleteRequest);

module.exports = router; 