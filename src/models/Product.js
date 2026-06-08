const mongoose = require('mongoose');
const slugify = require('slugify');

const NutritionSchema = new mongoose.Schema({
  servingSize: String,
  protein: String,
  carbs: String,
  fat: String,
  calories: String,
  sugar: String,
  fiber: String,
  sodium: String,
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters'],
  },
  slug: { type: String, unique: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, required: [true, 'Description is required'] },
  shortDescription: { type: String, maxlength: [200, 'Short description too long'] },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  discountPrice: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  images: [
    {
      public_id: String,
      url: { type: String, required: true },
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  brand: { type: String, default: 'HY Nutrition' },
  tags: [String],
  weight: String,
  flavors: [String],
  nutrition: NutritionSchema,
  ingredients: String,
  usageInstructions: String,
  warnings: String,
  stock: { type: Number, required: true, default: 0 },
  sold: { type: Number, default: 0 },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  badge: {
    type: String,
    enum: ['Best Seller', 'New', 'Top Rated', 'Popular', 'Hot', 'Vegan', 'Sale', ''],
    default: '',
  },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  metaTitle: String,
  metaDescription: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for discount percentage
ProductSchema.virtual('discount').get(function () {
  if (this.discountPrice && this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Auto-generate slug
ProductSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.discountPrice && this.price) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

// Index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isFeatured: 1, isBestSeller: 1 });
ProductSchema.index({ slug: 1 });

module.exports = mongoose.model('Product', ProductSchema);
