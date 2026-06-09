const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = (subDir) => {
  const dest = path.join(UPLOADS_ROOT, subDir);
  return multer.diskStorage({
    destination: (req, file, cb) => { ensureDir(dest); cb(null, dest); },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, jpeg, png, webp images are allowed'), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

exports.bannerUpload = multer({ storage: storage('banners'), fileFilter, limits });
exports.generalUpload = multer({ storage: storage('general'), fileFilter, limits });
exports.productUpload = multer({ storage: storage('products'), fileFilter, limits });
exports.categoryUpload = multer({ storage: storage('categories'), fileFilter, limits });
exports.blogUpload = multer({ storage: storage('blogs'), fileFilter, limits });
exports.UPLOADS_ROOT = UPLOADS_ROOT;
