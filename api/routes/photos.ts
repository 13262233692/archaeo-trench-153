import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });
const router = Router();

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { trenchId, stratumId, artifactId, description } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO photos (id, trench_id, stratum_id, artifact_id, filename, original_name, description, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, trenchId, stratumId || null, artifactId || null, req.file.filename, req.file.originalname, description || '', now);
  
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as any;
  res.status(201).json({ ...photo, url: `/uploads/${photo.filename}` });
});

router.get('/', (req, res) => {
  const photos = db.prepare('SELECT * FROM photos ORDER BY uploaded_at DESC').all() as any[];
  const photosWithUrls = photos.map(photo => ({
    ...photo,
    url: `/uploads/${photo.filename}`
  }));
  res.json(photosWithUrls);
});

router.delete('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id) as any;
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const filePath = path.join(uploadDir, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Photo deleted successfully' });
});

export default router;
