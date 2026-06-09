const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBlogs, getPublishedBlogs, getBlogBySlug,
  getBlogById, createBlog, updateBlog, deleteBlog,
} = require('../controllers/blogController');

const isAdmin = [protect, authorize('admin', 'superadmin')];

// Static paths MUST come before param routes
router.get('/published', getPublishedBlogs);       // GET /api/blogs/published
router.get('/id/:id', isAdmin, getBlogById);        // GET /api/blogs/id/:id  (admin)
router.get('/', isAdmin, getBlogs);                 // GET /api/blogs         (admin)
router.post('/', isAdmin, createBlog);              // POST /api/blogs        (admin)
router.put('/:id', isAdmin, updateBlog);            // PUT /api/blogs/:id     (admin)
router.delete('/:id', isAdmin, deleteBlog);         // DELETE /api/blogs/:id  (admin)
router.get('/:slug', getBlogBySlug);                // GET /api/blogs/:slug   (public) — LAST, catches all

module.exports = router;
