const express = require('express');
const router = express.Router();
const { generalUpload } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// POST /api/uploads - general image upload (products, etc.)
router.post('/', protect, authorize('admin', 'superadmin'), generalUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/general/${req.file.filename}` });
});

module.exports = router;
