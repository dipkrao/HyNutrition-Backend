const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  isActive: { type: Boolean, default: true },
  source: { type: String, default: 'website' },
}, { timestamps: true });

module.exports = mongoose.model('Newsletter', NewsletterSchema);
