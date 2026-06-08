const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { protect, authorize } = require('../middleware/auth');

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return res.json({ success: true, message: 'Subscribed successfully!' });
    }
    await Newsletter.create({ email });
    res.status(201).json({ success: true, message: 'Subscribed! Use code WELCOME15 for 15% off.' });
  } catch (e) { next(e); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    await Newsletter.findOneAndUpdate({ email: req.body.email }, { isActive: false });
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (e) { next(e); }
});

router.get('/', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: subscribers.length, subscribers });
  } catch (e) { next(e); }
});

module.exports = router;
