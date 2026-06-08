const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banner');
const { protect, authorize } = require('../middleware/auth');
const { bannerUpload, UPLOADS_ROOT } = require('../middleware/upload');

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  // imagePath stored as /uploads/banners/filename.jpg
  const abs = path.join(UPLOADS_ROOT, '..', imagePath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

// GET /api/banners — public, active banners only
router.get('/', async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, banners });
  } catch (e) { next(e); }
});

// GET /api/banners/all — admin, all banners
router.get('/all', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    res.json({ success: true, banners });
  } catch (e) { next(e); }
});

// POST /api/banners/upload — image-only upload, returns relative path
router.post('/upload', protect, authorize('admin', 'superadmin'), bannerUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/banners/${req.file.filename}` });
});

// POST /api/banners — create (JSON body, image already uploaded separately)
router.post('/', protect, authorize('admin', 'superadmin'), express.json(), async (req, res, next) => {
  try {
    const { title, highlight, subtitle, ctaText, ctaLink, bgColor, accentColor, isActive, sortOrder, image } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    const banner = await Banner.create({
      title, highlight, subtitle, ctaText, ctaLink, bgColor, accentColor,
      isActive: isActive !== false && isActive !== 'false',
      sortOrder: Number(sortOrder) || 0,
      image: image || '',
    });
    res.status(201).json({ success: true, banner });
  } catch (e) { next(e); }
});

// PUT /api/banners/:id — update (JSON body)
router.put('/:id', protect, authorize('admin', 'superadmin'), express.json(), async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.isActive !== undefined) update.isActive = update.isActive !== false && update.isActive !== 'false';
    if (update.sortOrder !== undefined) update.sortOrder = Number(update.sortOrder);

    // If image changed and old image exists, delete old file
    if (update.image !== undefined) {
      const existing = await Banner.findById(req.params.id);
      if (existing?.image && existing.image !== update.image) {
        deleteImageFile(existing.image);
      }
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (e) { next(e); }
});

// DELETE /api/banners/:id
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    deleteImageFile(banner.image);
    await banner.deleteOne();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
