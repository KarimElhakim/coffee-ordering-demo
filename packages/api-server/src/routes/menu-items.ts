import { Router } from 'express';
import { MenuItem, Station, Modifier } from '../models/index.js';

const router = Router();

// Get all menu items with relations
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    const query: any = { is_active: true };
    if (store_id) query.store_id = store_id;

    const items = await MenuItem.find(query).sort({ name: 1 });
    
    // Enrich with station and modifiers
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const station = await Station.findById(item.station_id);
      const modifiers = await Modifier.find({ store_id: item.store_id });
      
      const itemObj = item.toObject();
      return {
        ...itemObj,
        id: itemObj._id,
        station: station ? { ...station.toObject(), id: station._id } : null,
        modifiers: modifiers.map(mod => ({
          modifier: { ...mod.toObject(), id: mod._id }
        }))
      };
    }));

    res.json(enrichedItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

