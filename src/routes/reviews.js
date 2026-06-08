const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (e) { next(e); }
});

// Create review
router.post('/', protect, async (req, res, next) => {
  try {
    const { product, rating, title, comment } = req.body;
    // Check if user purchased the product
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': product,
      paymentStatus: 'paid',
    });
    const review = await Review.create({
      product, user: req.user._id, rating, title, comment,
      isVerifiedPurchase: !!order,
    });
    res.status(201).json({ success: true, review });
  } catch (e) { next(e); }
});

// Admin: get pending reviews
router.get('/pending', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (e) { next(e); }
});

// Admin: approve / reject review
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved }, { new: true });
    if (review) await Review.calcAverageRatings(review.product);
    res.json({ success: true, review });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) await Review.calcAverageRatings(review.product);
    res.json({ success: true, message: 'Review deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
