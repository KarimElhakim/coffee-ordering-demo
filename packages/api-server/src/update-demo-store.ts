import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRAPED_DATA = path.join(__dirname, '../scraped-data/starbucks-menu.json');
const DEMO_STORE_PATH = path.join(__dirname, '../../api-client/src/demo-store.ts');

// Map Starbucks categories to stations
const CATEGORY_TO_STATION: Record<string, string> = {
  'Hot Coffee': 'station-hot',
  'Hot Tea': 'station-hot',
  'Cold Coffee': 'station-cold',
  'Frappuccino® Blended Beverage': 'station-cold',
  'Cold Tea': 'station-cold',
  'Refreshers': 'station-cold',
  'Protein Beverages': 'station-bar'
};

function generatePrice(category: string, calories: number): number {
  const basePrice = category.includes('Frappuccino') ? 5.95 :
                    category.includes('Tea') ? 3.95 :
                    category.includes('Coffee') ? 4.95 : 4.45;
  
  const calorieModifier = (calories / 100) * 0.25;
  return parseFloat((basePrice + calorieModifier).toFixed(2));
}

async function updateDemoStore() {
  console.log('🔄 Converting Starbucks data to demo store format...\n');

  // Load scraped data
  const scrapedData = JSON.parse(fs.readFileSync(SCRAPED_DATA, 'utf-8'));
  console.log(`✓ Loaded ${scrapedData.length} Starbucks items\n`);

  // Convert to demo store format
  const demoItems = scrapedData.map((drink: any, index: number) => {
    const stationId = CATEGORY_TO_STATION[drink.category] || 'station-bar';
    const price = generatePrice(drink.category, drink.calories || 0);
    const itemId = drink.url ? `item-${drink.url.match(/\/(\d+)\//)?.[1] || index + 1000}` : `item-${index + 1000}`;
    
    // 15% chance of being out of stock for testing
    const isOutOfStock = Math.random() < 0.15;
    const stockQuantity = isOutOfStock ? 0 : Math.floor(Math.random() * 30) + 20;

    return {
      _id: itemId,
      id: itemId,
      store_id: '1',
      station_id: stationId,
      name: drink.name,
      base_price: price,
      is_active: !isOutOfStock,
      stock_quantity: stockQuantity,
      low_stock_threshold: 10,
      out_of_stock: isOutOfStock,
      track_inventory: true,
      // Starbucks specific data
      description: drink.description || `Delicious ${drink.name} from Starbucks`,
      category: drink.category,
      image_url: drink.imageUrl,
      local_image_path: drink.localImagePath,
      calories: drink.calories || 0,
      nutrition_info: {
        calories: drink.nutritionInfo?.calories || drink.calories || 0,
        sugar_g: drink.nutritionInfo?.sugar_g || 0,
        fat_g: drink.nutritionInfo?.fat_g || 0
      },
      available_sizes: drink.sizes || ['Tall', 'Grande', 'Venti'],
      customizations: drink.customizations || {},
      starbucks_stars: drink.stars,
      scraped_from_starbucks: true,
      starbucks_url: drink.url ? `https://www.starbucks.com${drink.url}` : null
    };
  });

  console.log('✅ Converted to demo format\n');
  console.log(`📊 Stats:`);
  console.log(`  Total items: ${demoItems.length}`);
  
  const byCategory = demoItems.reduce((acc: any, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} items`);
  });

  const outOfStock = demoItems.filter((i: any) => i.out_of_stock).length;
  console.log(`  Out of Stock: ${outOfStock} items (for testing)\n`);

  // Generate TypeScript code
  const timestamp = new Date().toISOString();
  const tsCode = `// AUTO-GENERATED FROM STARBUCKS SCRAPER - DO NOT EDIT MANUALLY
// Generated: ${timestamp}
// Source: Scraped from Starbucks.com

export const DEMO_MENU_ITEMS = ${JSON.stringify(demoItems, null, 2)};

export const DEMO_STORES = [
  {
    _id: '1',
    id: '1',
    name: 'Demo Coffee Shop',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  }
];

export const DEMO_STATIONS = [
  {
    _id: 'station-bar',
    id: 'station-bar',
    store_id: '1',
    name: 'Bar',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  },
  {
    _id: 'station-hot',
    id: 'station-hot',
    store_id: '1',
    name: 'Hot',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  },
  {
    _id: 'station-cold',
    id: 'station-cold',
    store_id: '1',
    name: 'Cold',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  }
];
`;

  // Save to a temporary file first
  const outputPath = path.join(__dirname, '../../api-client/src/demo-menu-items.ts');
  fs.writeFileSync(outputPath, tsCode);
  
  console.log(`✅ Generated demo store file: ${outputPath}\n`);
  console.log('📝 Next step: Update demo-store.ts to import from this file');
}

updateDemoStore()
  .then(() => {
    console.log('\n✨ Conversion complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });

