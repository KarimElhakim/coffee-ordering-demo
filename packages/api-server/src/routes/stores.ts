import { Router } from 'express';
import { Store } from '../models/index.js';

const router = Router();

// Get store
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    // Convert MongoDB document to plain object with id field
    const storeObj = store.toObject();
    res.json({ ...storeObj, id: storeObj._id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;


