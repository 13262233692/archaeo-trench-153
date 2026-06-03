import { Router } from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', (req, res) => {
  const { trenchId, stratumId, name, type, posX, posY, posZ, description } = req.body;
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO artifacts (id, trench_id, stratum_id, name, type, pos_x, pos_y, pos_z, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, trenchId, stratumId || null, name, type, posX, posY, posZ, description || '');
  
  const artifact = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id);
  res.status(201).json(artifact);
});

router.put('/:id', (req, res) => {
  const { name, type, stratumId, posX, posY, posZ, description } = req.body;
  
  const result = db.prepare(`
    UPDATE artifacts 
    SET name = ?, type = ?, stratum_id = ?, pos_x = ?, pos_y = ?, pos_z = ?, description = ?
    WHERE id = ?
  `).run(name, type, stratumId || null, posX, posY, posZ, description || '', req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  
  const artifact = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
  res.json(artifact);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM artifacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  res.json({ message: 'Artifact deleted successfully' });
});

export default router;
