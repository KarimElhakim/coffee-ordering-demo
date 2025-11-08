import { connectDB } from './db.js';
import { Store, MenuItem, Station } from './models/index.js';

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB connection...\n');
    
    // Connect
    await connectDB();
    console.log('✅ Successfully connected to MongoDB\n');
    
    // Test queries
    console.log('🔍 Testing database queries...\n');
    
    const storeCount = await Store.countDocuments();
    console.log(`   Stores: ${storeCount}`);
    
    const menuItemsCount = await MenuItem.countDocuments();
    console.log(`   Menu Items: ${menuItemsCount}`);
    
    const stationsCount = await Station.countDocuments();
    console.log(`   Stations: ${stationsCount}`);
    
    if (storeCount === 0) {
      console.log('\n⚠️  Database is empty. Run: pnpm seed');
    } else {
      console.log('\n✅ Database has data!');
    }
    
    console.log('\n✨ All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.error('\n💡 Make sure MongoDB is running:');
    console.error('   - Windows: net start MongoDB');
    console.error('   - macOS: brew services start mongodb-community');
    console.error('   - Linux: sudo systemctl start mongod\n');
    process.exit(1);
  }
}

testConnection();

