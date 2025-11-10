import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Router } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Path to scraped data
const DATA_FILE = path.join(__dirname, '../scraped-data/starbucks-menu.json');
const IMAGES_DIR = path.join(__dirname, '../scraped-data/images');

/**
 * Load Starbucks menu data
 */
function loadMenuData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Starbucks menu data:', error);
    return [];
  }
}

/**
 * GET /api/starbucks/menu - Get all drinks
 */
router.get('/menu', (req, res) => {
  try {
    const menu = loadMenuData();
    const { category, search, limit } = req.query;

    let filtered = menu;

    // Filter by category
    if (category && typeof category === 'string') {
      filtered = filtered.filter((item: any) => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search by name or description
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Limit results
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        filtered = filtered.slice(0, limitNum);
      }
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error in /api/starbucks/menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/starbucks/categories - Get all categories
 */
router.get('/categories', (req, res) => {
  try {
    const menu = loadMenuData();
    const categories = [...new Set(menu.map((item: any) => item.category))];
    
    const categoriesWithCounts = categories.map(cat => ({
      name: cat,
      count: menu.filter((item: any) => item.category === cat).length
    }));

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error in /api/starbucks/categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/starbucks/drink/:name - Get specific drink by name
 */
router.get('/drink/:name', (req, res) => {
  try {
    const menu = loadMenuData();
    const { name } = req.params;
    
    const drink = menu.find((item: any) => 
      item.name.toLowerCase() === name.toLowerCase().replace(/_/g, ' ')
    );

    if (drink) {
      res.json(drink);
    } else {
      res.status(404).json({ error: 'Drink not found' });
    }
  } catch (error) {
    console.error('Error in /api/starbucks/drink:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/starbucks/stats - Get menu statistics
 */
router.get('/stats', (req, res) => {
  try {
    const menu = loadMenuData();
    
    const stats = {
      totalDrinks: menu.length,
      categories: {} as Record<string, number>,
      avgCalories: 0,
      drinksWithImages: 0,
      lastUpdated: null as string | null
    };

    // Count by category
    menu.forEach((item: any) => {
      if (!stats.categories[item.category]) {
        stats.categories[item.category] = 0;
      }
      stats.categories[item.category]++;

      if (item.localImagePath) {
        stats.drinksWithImages++;
      }
    });

    // Calculate average calories
    const caloriesDrinks = menu.filter((item: any) => item.calories > 0);
    if (caloriesDrinks.length > 0) {
      const totalCalories = caloriesDrinks.reduce((sum: number, item: any) => sum + item.calories, 0);
      stats.avgCalories = Math.round(totalCalories / caloriesDrinks.length);
    }

    // Get last update time
    if (menu.length > 0 && menu[0].scrapedAt) {
      stats.lastUpdated = menu[0].scrapedAt;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error in /api/starbucks/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

