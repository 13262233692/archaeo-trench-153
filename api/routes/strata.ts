import { Router } from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', (req, res) => {
  const { trenchId, name, color, description, topDepth, bottomDepth, orderIndex, dip = 0, strike = 0 } = req.body;
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO strata (id, trench_id, name, color, description, top_depth, bottom_depth, order_index, dip, strike)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, trenchId, name, color, description || '', topDepth, bottomDepth, orderIndex, dip, strike);
  
  const stratum = db.prepare('SELECT * FROM strata WHERE id = ?').get(id);
  res.status(201).json(stratum);
});

router.put('/:id', (req, res) => {
  const { name, color, description, topDepth, bottomDepth, orderIndex, dip = 0, strike = 0 } = req.body;
  
  const result = db.prepare(`
    UPDATE strata 
    SET name = ?, color = ?, description = ?, top_depth = ?, bottom_depth = ?, order_index = ?, dip = ?, strike = ?
    WHERE id = ?
  `).run(name, color, description || '', topDepth, bottomDepth, orderIndex, dip, strike, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Stratum not found' });
  }
  
  const stratum = db.prepare('SELECT * FROM strata WHERE id = ?').get(req.params.id);
  res.json(stratum);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM strata WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Stratum not found' });
  }
  res.json({ message: 'Stratum deleted successfully' });
});

export default router;
