import { connectDB } from './db.js';
import {
  Store,
  Table,
  Station,
  MenuItem,
  Modifier,
} from './models/index.js';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Store.deleteMany({});
    await Table.deleteMany({});
    await Station.deleteMany({});
    await MenuItem.deleteMany({});
    await Modifier.deleteMany({});

    // Create store
    console.log('🏪 Creating store...');
    await Store.create({
      _id: '1',
      name: 'Demo Coffee Shop',
    });

    // Create tables
    console.log('🪑 Creating tables...');
    const tables = Array.from({ length: 12 }, (_, i) => ({
      _id: `table-${i + 1}`,
      store_id: '1',
      label: `Table ${i + 1}`,
    }));
    await Table.insertMany(tables);

    // Create stations
    console.log('🏭 Creating stations...');
    const stations = [
      { _id: 'station-bar', store_id: '1', name: 'Bar' },
      { _id: 'station-hot', store_id: '1', name: 'Hot' },
      { _id: 'station-cold', store_id: '1', name: 'Cold' },
    ];
    await Station.insertMany(stations);

    // Create menu items
    console.log('☕ Creating menu items...');
    const menuItems = [
      // Bar Station - Espresso Drinks
      {
        _id: 'item-espresso',
        store_id: '1',
        name: 'Espresso',
        base_price: 25,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: true,
      },
      {
        _id: 'item-cappuccino',
        store_id: '1',
        name: 'Cappuccino',
        base_price: 35,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 45,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: true,
      },
      {
        _id: 'item-latte',
        store_id: '1',
        name: 'Caffè Latte',
        base_price: 40,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 8,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: true,
      },
      {
        _id: 'item-americano',
        store_id: '1',
        name: 'Americano',
        base_price: 30,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 40,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: true,
      },
      {
        _id: 'item-macchiato',
        store_id: '1',
        name: 'Macchiato',
        base_price: 32,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-flat-white',
        store_id: '1',
        name: 'Flat White',
        base_price: 38,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-mocha',
        store_id: '1',
        name: 'Mocha',
        base_price: 42,
        station_id: 'station-bar',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      // Hot Station
      {
        _id: 'item-hot-chocolate',
        store_id: '1',
        name: 'Hot Chocolate',
        base_price: 30,
        station_id: 'station-hot',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-chai-latte',
        store_id: '1',
        name: 'Chai Latte',
        base_price: 35,
        station_id: 'station-hot',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-matcha-latte',
        store_id: '1',
        name: 'Matcha Latte',
        base_price: 38,
        station_id: 'station-hot',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-turkish-coffee',
        store_id: '1',
        name: 'Turkish Coffee',
        base_price: 28,
        station_id: 'station-hot',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      // Cold Station
      {
        _id: 'item-iced-latte',
        store_id: '1',
        name: 'Iced Latte',
        base_price: 40,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-iced-americano',
        store_id: '1',
        name: 'Iced Americano',
        base_price: 32,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-cold-brew',
        store_id: '1',
        name: 'Cold Brew',
        base_price: 35,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-frappuccino',
        store_id: '1',
        name: 'Frappuccino',
        base_price: 45,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-iced-mocha',
        store_id: '1',
        name: 'Iced Mocha',
        base_price: 44,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
      {
        _id: 'item-smoothie',
        store_id: '1',
        name: 'Fruit Smoothie',
        base_price: 40,
        station_id: 'station-cold',
        is_active: true,
        stock_quantity: 50,
        low_stock_threshold: 10,
        out_of_stock: false,
        track_inventory: false,
      },
    ];
    await MenuItem.insertMany(menuItems);

    // Create modifiers
    console.log('🔧 Creating modifiers...');
    const modifiers = [
      { _id: 'mod-size', store_id: '1', name: 'Size', type: 'single' },
      { _id: 'mod-milk', store_id: '1', name: 'Milk', type: 'single' },
      { _id: 'mod-shots', store_id: '1', name: 'Extra Shots', type: 'multi' },
      { _id: 'mod-syrups', store_id: '1', name: 'Syrups', type: 'multi' },
      { _id: 'mod-toppings', store_id: '1', name: 'Toppings', type: 'multi' },
    ];
    await Modifier.insertMany(modifiers);

    console.log('✅ Database seeded successfully!');
    console.log(`   - Created 1 store`);
    console.log(`   - Created ${tables.length} tables`);
    console.log(`   - Created ${stations.length} stations`);
    console.log(`   - Created ${menuItems.length} menu items`);
    console.log(`   - Created ${modifiers.length} modifiers`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

