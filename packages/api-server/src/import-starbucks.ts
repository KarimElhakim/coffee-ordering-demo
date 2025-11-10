import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MenuItem, Store, Station } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATA_FILE = path.join(__dirname, '../scraped-data/starbucks-menu.json');

/**
 * Map Starbucks categories to our stations
 */
const CATEGORY_TO_STATION: Record<string, string> = {
  'Hot Coffee': 'station-hot',
  'Hot Tea': 'station-hot',
  'Cold Coffee': 'station-cold',
  'Frappuccino® Blended Beverage': 'station-cold',
  'Cold Tea': 'station-cold',
  'Refreshers': 'station-cold',
  'Protein Beverages': 'station-bar'
};

/**
 * Generate price based on category and size
 */
function generatePrice(category: string, calories: number): number {
  const basePrice = category.includes('Protein') ? 6.95 :
                    category.includes('Frappuccino') ? 5.95 :
                    category.includes('Tea') ? 3.95 :
                    category.includes('Coffee') ? 4.95 : 4.45;
  
  // Add slight variation based on calories (higher calories = premium ingredients)
  const calorieModifier = (calories / 100) * 0.25;
  
  return parseFloat((basePrice + calorieModifier).toFixed(2));
}

/**
 * Map Starbucks drink to our menu item schema
 */
function mapDrinkToMenuItem(drink: any, index: number) {
  const stationId = CATEGORY_TO_STATION[drink.category] || 'station-bar';
  const price = generatePrice(drink.category, drink.calories || 0);
  
  // Determine initial stock based on item type
  const isPopular = drink.calories > 200 && drink.calories < 400;
  const stockQuantity = isPopular ? Math.floor(Math.random() * 20) + 30 : Math.floor(Math.random() * 30) + 20;
  const isOutOfStock = Math.random() < 0.15; // 15% chance of being out of stock for testing
  
  const itemId = drink.url ? `item-${drink.url.match(/\/(\d+)\//)?.[1] || index + 1000}` : `item-${index + 1000}`;
  
  return {
    _id: itemId,
    store_id: '1',  // Default store
    station_id: stationId,
    name: drink.name,
    base_price: price,
    is_active: !isOutOfStock,
    stock_quantity: isOutOfStock ? 0 : stockQuantity,
    low_stock_threshold: 10,
    out_of_stock: isOutOfStock,
    track_inventory: true,
    // Additional metadata (stored but not in schema - will be ignored)
    description: drink.description || `Delicious ${drink.name}`,
    category: drink.category,
    image_url: drink.imageUrl || `/images/default-coffee.jpg`,
    local_image_path: drink.localImagePath || null,
    calories: drink.calories || 0,
    nutrition_info: {
      calories: drink.nutritionInfo?.calories || drink.calories || 0,
      sugar_g: drink.nutritionInfo?.sugar_g || 0,
      fat_g: drink.nutritionInfo?.fat_g || 0
    },
    available_sizes: drink.sizes && drink.sizes.length > 0 ? drink.sizes : ['Tall', 'Grande', 'Venti'],
    customizations: drink.customizations || {},
    starbucks_stars: drink.stars || null,
    scraped_from_starbucks: true,
    starbucks_url: drink.url ? `https://www.starbucks.com${drink.url}` : null
  };
}

/**
 * Import Starbucks menu to MongoDB
 */
async function importStarbucksMenu() {
  console.log('🚀 Starting Starbucks menu import to MongoDB...\n');

  try {
    // Check if data file exists
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`❌ Data file not found: ${DATA_FILE}`);
      console.log('Please run the scraper first: node src/starbucks-scraper.js');
      process.exit(1);
    }

    // Load scraped data
    console.log('📂 Loading scraped data...');
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const starbucksDrinks = JSON.parse(rawData);

    if (!starbucksDrinks || starbucksDrinks.length === 0) {
      console.error('❌ No drinks found in data file');
      process.exit(1);
    }

    console.log(`✓ Loaded ${starbucksDrinks.length} drinks from Starbucks\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-shop';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Ensure Store exists
    console.log('🏪 Ensuring store exists...');
    await Store.findOneAndUpdate(
      { _id: '1' },
      { _id: '1', name: 'Demo Coffee Shop' },
      { upsert: true }
    );
    console.log('✓ Store ready\n');

    // Ensure Stations exist
    console.log('🏭 Ensuring stations exist...');
    const stations = [
      { _id: 'station-bar', store_id: '1', name: 'Bar' },
      { _id: 'station-hot', store_id: '1', name: 'Hot' },
      { _id: 'station-cold', store_id: '1', name: 'Cold' },
    ];
    for (const station of stations) {
      await Station.findOneAndUpdate(
        { _id: station._id },
        station,
        { upsert: true }
      );
    }
    console.log('✓ Stations ready\n');

    // Clear existing menu items
    console.log('🗑️  Clearing existing menu items...');
    await MenuItem.deleteMany({});
    console.log('✓ Cleared existing items\n');

    // Map and import drinks
    console.log('📥 Importing Starbucks drinks...');
    const menuItems = starbucksDrinks.map((drink: any, index: number) => 
      mapDrinkToMenuItem(drink, index)
    );

    let imported = 0;
    let failed = 0;

    for (const item of menuItems) {
      try {
        await MenuItem.create(item);
        imported++;
        if (imported % 10 === 0) {
          console.log(`  Imported ${imported}/${menuItems.length} items...`);
        }
      } catch (error: any) {
        failed++;
        console.error(`  ✗ Failed to import "${item.name}":`, error.message);
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`  ✓ Successfully imported: ${imported} items`);
    if (failed > 0) {
      console.log(`  ✗ Failed: ${failed} items`);
    }

    // Show category breakdown
    console.log(`\n📊 Category breakdown:`);
    const categories = menuItems.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} items`);
    });

    // Show stock status
    const outOfStock = menuItems.filter((item: any) => item.out_of_stock).length;
    const lowStock = menuItems.filter((item: any) => 
      !item.out_of_stock && item.stock_quantity <= item.low_stock_threshold
    ).length;
    
    console.log(`\n📦 Inventory status:`);
    console.log(`  In Stock: ${imported - outOfStock} items`);
    console.log(`  Low Stock: ${lowStock} items`);
    console.log(`  Out of Stock: ${outOfStock} items (for testing)`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if executed directly
importStarbucksMenu()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Import failed:', err);
    process.exit(1);
  });

