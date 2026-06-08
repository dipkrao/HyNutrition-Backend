const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder, getMyOrders, getOrder, cancelOrder,
  getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin
router.get('/', protect, authorize('admin', 'superadmin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin', 'superadmin'), updateOrderStatus);

module.exports = router;
