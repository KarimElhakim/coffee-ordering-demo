import { Router } from 'express';
import { Station } from '../models/index.js';

const router = Router();

// Get all stations
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    const query: any = {};
    if (store_id) query.store_id = store_id;

    const stations = await Station.find(query).sort({ name: 1 });
    const result = stations.map(s => {
      const obj = s.toObject();
      return { ...obj, id: obj._id };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

