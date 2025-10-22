const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const root = path.join(__dirname, '..', '..', 'uploads', 'property-photos');
fs.mkdirSync(root, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, root),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = { upload };
