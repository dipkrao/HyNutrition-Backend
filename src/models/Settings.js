const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'HY Nutrition' },
  tagline: { type: String, default: 'Fuel Your Limits' },
  email: { type: String, default: 'support@hynutrition.in' },
  phone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: 'Koramangala, Bangalore, KA 560034' },
  social: {
    instagram: { type: String, default: 'https://instagram.com/hynutrition' },
    facebook: { type: String, default: 'https://facebook.com/hynutrition' },
    youtube: { type: String, default: 'https://youtube.com/hynutrition' },
    twitter: { type: String, default: 'https://twitter.com/hynutrition' },
  },
  shipping: {
    freeShippingThreshold: { type: Number, default: 999 },
    defaultShipping: { type: Number, default: 99 },
    taxRate: { type: Number, default: 5 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
