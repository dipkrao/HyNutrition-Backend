const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  highlight:   { type: String, default: '' },
  subtitle:    { type: String, default: '' },
  ctaText:     { type: String, default: 'Shop Now' },
  ctaLink:     { type: String, default: '/shop' },
  image:       { type: String, default: '' },  // e.g. /uploads/banners/banner-123.jpg
  bgColor:     { type: String, default: '#0a0a0a' },
  accentColor: { type: String, default: '#f59e0b' },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
