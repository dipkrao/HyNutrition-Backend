const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

const buildProductQuery = (query) => {
  const filter = { isActive: true };
  if (query.category) filter.category = query.category;
  if (query.isFeatured === 'true') filter.isFeatured = true;
  if (query.isBestSeller === 'true') filter.isBestSeller = true;
  if (query.badge) filter.badge = query.badge;
  if (query.minPrice || query.maxPrice) {
    filter.discountPrice = {};
    if (query.minPrice) filter.discountPrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.discountPrice.$lte = Number(query.maxPrice);
  }
  if (query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.search) filter.$text = { $search: query.search };
  return filter;
};

// Parse incoming files into image objects
const parseUploadedImages = (files = []) =>
  files.map(file => ({
    public_id: file.filename,
    url: `/uploads/products/${file.filename}`,
  }));

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = buildProductQuery(req.query);

    let sortObj = {};
    switch (req.query.sort) {
      case 'price-asc': sortObj = { discountPrice: 1 }; break;
      case 'price-desc': sortObj = { discountPrice: -1 }; break;
      case 'rating': sortObj = { ratings: -1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'popular': sortObj = { sold: -1 }; break;
      default: sortObj = { isFeatured: -1, createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sortObj).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, count: products.length, total, totalPages: Math.ceil(total / limit), currentPage: page, products });
  } catch (err) { next(err); }
};

// @desc    Get single product
// @route   GET /api/products/:slug
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
      isActive: true,
    }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc    Create product (admin)
// @route   POST /api/products  (multipart/form-data)
exports.createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // Parse boolean/number fields from form-data strings
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true';
    if (data.isBestSeller !== undefined) data.isBestSeller = data.isBestSeller === 'true';
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true';
    if (data.price) data.price = Number(data.price);
    if (data.discountPrice) data.discountPrice = Number(data.discountPrice);
    if (data.stock) data.stock = Number(data.stock);

    const newImages = parseUploadedImages(req.files);
    if (newImages.length) data.images = newImages;

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc    Update product (admin)
// @route   PUT /api/products/:id  (multipart/form-data)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const data = { ...req.body };
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true';
    if (data.isBestSeller !== undefined) data.isBestSeller = data.isBestSeller === 'true';
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true';
    if (data.price) data.price = Number(data.price);
    if (data.discountPrice) data.discountPrice = Number(data.discountPrice);
    if (data.stock !== undefined) data.stock = Number(data.stock);

    // Append newly uploaded images to existing ones
    const newImages = parseUploadedImages(req.files);
    if (newImages.length) {
      data.images = [...(product.images || []), ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.status(200).json({ success: true, product: updated });
  } catch (err) { next(err); }
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = false;
    await product.save();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

// @desc    Upload images to existing product
// @route   POST /api/products/:id/images
exports.uploadImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const images = parseUploadedImages(req.files);
    product.images.push(...images);
    await product.save();
    res.status(200).json({ success: true, images: product.images });
  } catch (err) { next(err); }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:publicId
exports.deleteImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const publicId = decodeURIComponent(req.params.publicId);

    // Try both products and general dirs
    for (const dir of ['products', 'general']) {
      const filePath = path.join(__dirname, `../../uploads/${dir}`, publicId);
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); break; }
    }

    product.images = product.images.filter(img => img.public_id !== publicId);
    await product.save();
    res.status(200).json({ success: true, images: product.images });
  } catch (err) { next(err); }
};

// @desc    Get featured products
// @route   GET /api/products/featured
exports.getFeatured = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).populate('category', 'name slug').limit(8);
    res.status(200).json({ success: true, products });
  } catch (err) { next(err); }
};

// @desc    Get best sellers
// @route   GET /api/products/bestsellers
exports.getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true, isActive: true }).populate('category', 'name slug').sort({ sold: -1 }).limit(8);
    res.status(200).json({ success: true, products });
  } catch (err) { next(err); }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
exports.getRelated = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(4);
    res.status(200).json({ success: true, products: related });
  } catch (err) { next(err); }
};
