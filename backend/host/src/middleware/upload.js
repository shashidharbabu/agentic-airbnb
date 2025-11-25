const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
// Use Node.js built-in crypto.randomUUID() (available in Node 18+)
const uuid = () => crypto.randomUUID();

// Property photos storage
const propertyPhotosRoot = path.join(__dirname, '..', '..', 'uploads', 'property-photos');
fs.mkdirSync(propertyPhotosRoot, { recursive: true });

const propertyPhotosStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, propertyPhotosRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({ storage: propertyPhotosStorage });

// Profile pictures storage
const profilePicturesRoot = path.join(__dirname, '..', '..', 'uploads', 'profile-pictures');
fs.mkdirSync(profilePicturesRoot, { recursive: true });

const profilePicturesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilePicturesRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `profile-${uuid()}${ext}`);
  }
});

const uploadProfilePicture = multer({ 
  storage: profilePicturesStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(ext);
    
    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

module.exports = { upload, uploadProfilePicture };
