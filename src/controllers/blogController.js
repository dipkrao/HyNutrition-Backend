const Blog = require('../models/Blog');
const slugify = require('slugify');

// @desc  Get all blogs (admin) — supports search, status, pagination
// @route GET /api/blogs
// @access Private (admin)
exports.getBlogs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Blog.countDocuments(query),
    ]);
    res.json({ success: true, blogs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get published blogs only — supports tag, category, pagination
// @route GET /api/blogs/published
// @access Public
exports.getPublishedBlogs = async (req, res) => {
  try {
    const { tag, category, page = 1, limit = 12 } = req.query;
    const query = { status: 'published' };
    if (tag) query.tags = tag.toLowerCase();
    if (category) query.category = { $regex: new RegExp(category, 'i') };

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query).sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)),
      Blog.countDocuments(query),
    ]);
    res.json({ success: true, blogs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single blog by slug (public — published only, increments views)
// @route GET /api/blogs/:slug
// @access Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single blog by ID (admin)
// @route GET /api/blogs/id/:id
// @access Private (admin)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create blog
// @route POST /api/blogs
// @access Private (admin)
exports.createBlog = async (req, res) => {
  try {
    const { title, slug } = req.body;
    const finalSlug = slug?.trim()
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    // Handle slug conflicts
    let uniqueSlug = finalSlug;
    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) uniqueSlug = `${finalSlug}-${Date.now()}`;

    const blog = await Blog.create({
      ...req.body,
      slug: uniqueSlug,
      authorId: req.user._id,
      author: req.body.author || req.user.name,
      publishedAt: req.body.status === 'published' ? new Date() : undefined,
    });
    res.status(201).json({ success: true, blog });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists. Please use a different slug.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update blog
// @route PUT /api/blogs/:id
// @access Private (admin)
exports.updateBlog = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.slug) update.slug = slugify(update.slug, { lower: true, strict: true });
    if (update.status === 'published') update.publishedAt = new Date();

    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete blog
// @route DELETE /api/blogs/:id
// @access Private (admin)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
