const Category = require('../models/Category');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.featured === 'true') filter.isFeatured = true;

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    // Attach product counts
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id?.toString()] = c.count; });

    const result = categories.map(cat => ({
      ...cat.toObject(),
      productCount: countMap[cat._id.toString()] || 0,
    }));

    res.json({ success: true, categories: result });
  } catch (err) { next(err); }
};

// GET /api/categories/:slug
exports.getCategory = async (req, res, next) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('parentCategory', 'name slug');
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat });
  } catch (err) { next(err); }
};

// POST /api/categories  (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    if (data.parentCategory === '' || data.parentCategory === 'null') data.parentCategory = null;

    if (req.file) {
      data.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(data);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
};

// PUT /api/categories/:id  (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const existing = await Category.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });

    const data = { ...req.body };
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    if (data.parentCategory === '' || data.parentCategory === 'null') data.parentCategory = null;

    if (req.file) {
      // Remove old image file
      if (existing.image) {
        const oldPath = path.join(__dirname, '../../', existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image = `/uploads/categories/${req.file.filename}`;
    }

    // Re-slug if name changed
    if (data.name && data.name !== existing.name) {
      const slugify = require('slugify');
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('parentCategory', 'name slug');
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

// DELETE /api/categories/:id  (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });

    if (cat.image) {
      const imgPath = path.join(__dirname, '../../', cat.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};
