// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/stats', protect, authorize('admin', 'superadmin'), getDashboardStats);

module.exports = router;
