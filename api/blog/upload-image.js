const crypto = require('crypto');
const Busboy = require('busboy');
const { put } = require('@vercel/blob');
const { isAuthenticated } = require('../_lib/auth');

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function parseUpload(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_BYTES } });
    let result = null;
    let tooLarge = false;

    busboy.on('file', (_fieldname, file, info) => {
      const ext = ALLOWED_MIME_EXT[info.mimeType];
      if (!ext) {
        file.resume(); // drain the stream so busboy can finish
        reject(new Error('Unsupported image type — use JPEG, PNG, WebP or GIF'));
        return;
      }
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => { tooLarge = true; });
      file.on('end', () => {
        if (tooLarge) return; // 'finish' below reports the error
        result = { buffer: Buffer.concat(chunks), mimeType: info.mimeType, ext };
      });
    });

    busboy.on('finish', () => {
      if (tooLarge) { reject(new Error('Image too large (max 8MB)')); return; }
      if (!result) { reject(new Error('No image file provided')); return; }
      resolve(result);
    });
    busboy.on('error', reject);

    req.pipe(busboy);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  let upload;
  try {
    upload = await parseUpload(req);
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message || 'Invalid upload' });
    return;
  }

  try {
    const pathname = `blog-images/${crypto.randomUUID()}.${upload.ext}`;
    const blob = await put(pathname, upload.buffer, {
      access: 'public',
      contentType: upload.mimeType,
    });
    res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('blog image upload error', err);
    res.status(500).json({ ok: false, error: 'Upload failed' });
  }
};
