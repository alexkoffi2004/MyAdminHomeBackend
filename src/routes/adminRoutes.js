const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getStats,
  getRecentPayments,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/adminController');

// Routes protégées pour les admins
router.get('/stats', protect, isAdmin, getStats);
router.get('/payments/recent', protect, isAdmin, getRecentPayments);

// Routes de gestion des utilisateurs
router.get('/users', protect, isAdmin, getUsers);
router.put('/users/:id', protect, isAdmin, updateUser);
router.delete('/users/:id', protect, isAdmin, deleteUser);

module.exports = router; 