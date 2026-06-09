const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  excerpt: { type: String, maxlength: 500 },
  content: { type: String, required: [true, 'Content is required'] },
  featuredImage: { type: String, default: '' },
  featuredImageAlt: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: [{ type: String, lowercase: true, trim: true }],
  author: { type: String, default: 'Admin' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date },
}, { timestamps: true });

BlogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

BlogSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.status === 'published' && !update.publishedAt) {
    update.publishedAt = new Date();
  }
  next();
});

BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Blog', BlogSchema);
