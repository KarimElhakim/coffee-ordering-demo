import { Router } from 'express';
import { Modifier } from '../models/index.js';

const router = Router();

// Get all modifiers
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    const query: any = {};
    if (store_id) query.store_id = store_id;

    const modifiers = await Modifier.find(query).sort({ name: 1 });
    const result = modifiers.map(m => {
      const obj = m.toObject();
      return { ...obj, id: obj._id };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;


