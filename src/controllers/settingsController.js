const Settings = require('../models/Settings');

// @desc    Get settings (public)
// @route   GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update settings (admin only)
// @route   PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};
