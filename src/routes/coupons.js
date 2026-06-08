// routes/coupons.js
const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// Validate coupon (user)
router.post('/validate', protect, async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ code: req.body.code?.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    const validity = coupon.isValid(req.user._id, req.body.orderTotal || 0);
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });
    const discount = coupon.calculateDiscount(req.body.orderTotal || 0);
    res.json({ success: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount } });
  } catch (e) { next(e); }
});

// Admin CRUD
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (e) { next(e); }
});

router.post('/', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (e) { next(e); }
});

router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
