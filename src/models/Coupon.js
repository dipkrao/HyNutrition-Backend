const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  userLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

CouponSchema.methods.isValid = function (userId, orderTotal) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.validUntil && now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon is not yet active' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderTotal < this.minOrderValue) return { valid: false, message: `Minimum order of ₹${this.minOrderValue} required` };
  const userUsage = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUsage >= this.userLimit) return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

CouponSchema.methods.calculateDiscount = function (orderTotal) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, orderTotal);
};

module.exports = mongoose.model('Coupon', CouponSchema);
