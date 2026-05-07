const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    // Preserve extension so audio players can identify the format
    const ext  = path.extname(file.originalname) || _guessExt(file.mimetype);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

function _guessExt(mime) {
  const map = {
    'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.mp4',
    'audio/mpeg': '.mp3',  'audio/wav': '.wav',  'audio/x-wav': '.wav',
    'image/jpeg': '.jpg',  'image/png': '.png',  'image/gif': '.gif',
    'image/webp': '.webp'
  };
  return map[mime] || '';
}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
      'audio/wav',  'audio/x-wav', 'audio/aac',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    // Also allow if mimetype starts with audio/ or image/
    if (allowed.includes(file.mimetype) ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

function handleUpload(fieldName) {
  return (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({
      success:  true,
      url:      `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size:     req.file.size,
      mimetype: req.file.mimetype
    });
  };
}

// POST /api/upload/voice
router.post('/voice',    upload.single('voice'),    handleUpload('voice'));
// POST /api/upload/landmark
router.post('/landmark', upload.single('landmark'), handleUpload('landmark'));
// POST /api/upload  (generic)
router.post('/',         upload.single('file'),     handleUpload('file'));

module.exports = router;
