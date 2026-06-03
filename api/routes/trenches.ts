import { Router } from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const trenches = db.prepare('SELECT * FROM trenches ORDER BY created_at DESC').all();
  res.json(trenches);
});

router.get('/:id', (req, res) => {
  const trench = db.prepare('SELECT * FROM trenches WHERE id = ?').get(req.params.id);
  if (!trench) {
    return res.status(404).json({ error: 'Trench not found' });
  }
  res.json(trench);
});

router.post('/', (req, res) => {
  const { name, location, length, width, depth } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO trenches (id, name, location, length, width, depth, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, location || '', length, width, depth, now, now);
  
  const trench = db.prepare('SELECT * FROM trenches WHERE id = ?').get(id);
  res.status(201).json(trench);
});

router.put('/:id', (req, res) => {
  const { name, location, length, width, depth } = req.body;
  const now = new Date().toISOString();
  
  const result = db.prepare(`
    UPDATE trenches 
    SET name = ?, location = ?, length = ?, width = ?, depth = ?, updated_at = ?
    WHERE id = ?
  `).run(name, location || '', length, width, depth, now, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Trench not found' });
  }
  
  const trench = db.prepare('SELECT * FROM trenches WHERE id = ?').get(req.params.id);
  res.json(trench);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM trenches WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Trench not found' });
  }
  res.json({ message: 'Trench deleted successfully' });
});

router.get('/:id/strata', (req, res) => {
  const strata = db.prepare('SELECT * FROM strata WHERE trench_id = ? ORDER BY order_index').all(req.params.id);
  res.json(strata);
});

router.get('/:id/artifacts', (req, res) => {
  const artifacts = db.prepare('SELECT * FROM artifacts WHERE trench_id = ?').all(req.params.id);
  res.json(artifacts);
});

router.get('/:id/photos', (req, res) => {
  const photos = db.prepare('SELECT * FROM photos WHERE trench_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
  res.json(photos);
});

export default router;
