// This file contains stubs – each section is its own route file

// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({ role: 'user' }),
    ]);
    res.json({ success: true, users, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.put('/:id/block', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

router.put('/:id/role', protect, authorize('superadmin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

module.exports = router;
