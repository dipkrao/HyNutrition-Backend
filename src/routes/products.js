const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { productUpload, generalUpload } = require('../middleware/upload');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadImages, deleteImage, getFeatured, getBestSellers, getRelated,
} = require('../controllers/productController');

const adminOnly = [protect, authorize('admin', 'superadmin')];

router.get('/', getProducts);
router.get('/featured', getFeatured);
router.get('/bestsellers', getBestSellers);
router.get('/:slug', getProduct);
router.get('/:id/related', getRelated);

router.post('/', ...adminOnly, productUpload.array('images', 6), createProduct);
router.put('/:id', ...adminOnly, productUpload.array('images', 6), updateProduct);
router.delete('/:id', ...adminOnly, deleteProduct);

// Legacy per-product image upload endpoint
router.post('/:id/images', ...adminOnly, productUpload.array('images', 6), uploadImages);
router.delete('/:id/images/:publicId', ...adminOnly, deleteImage);

module.exports = router;
