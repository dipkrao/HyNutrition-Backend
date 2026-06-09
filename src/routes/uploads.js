const express = require('express');
const router = express.Router();
const { generalUpload, blogUpload } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const isAdmin = [protect, authorize('admin', 'superadmin')];

// POST /api/uploads — general image upload
router.post('/', isAdmin, generalUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/general/${req.file.filename}` });
});

// POST /api/uploads/blog — blog featured image upload
router.post('/blog', isAdmin, blogUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/blogs/${req.file.filename}` });
});

module.exports = router;
