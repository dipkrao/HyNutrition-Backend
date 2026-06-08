const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }, // local path e.g. /uploads/categories/file.jpg
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  icon: { type: String, default: '💊' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
}, { timestamps: true });

CategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

CategorySchema.index({ isActive: 1, isFeatured: 1 });

module.exports = mongoose.model('Category', CategorySchema);
