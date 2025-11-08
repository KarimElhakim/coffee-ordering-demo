#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('\n⚙️  Configuring MongoDB Atlas Connection...\n');

// Your connection string
const connectionString = 'mongodb+srv://karimali1896_db_user:NKAkqUiYF7qjs1qd@coffeecluster.giagzlr.mongodb.net/coffee-shop?retryWrites=true&w=majority';

// Create API server .env
const apiEnv = `PORT=3001
MONGODB_URI=${connectionString}
NODE_ENV=development
`;

writeFileSync(join(__dirname, '.env'), apiEnv);
console.log('✅ Created packages/api-server/.env');

// Create root .env
const rootEnv = `# API Configuration
VITE_API_URL=http://localhost:3001

# Set to 'false' to use MongoDB Atlas (cloud database)
VITE_USE_DEMO_MODE=false
`;

writeFileSync(join(__dirname, '../../.env'), rootEnv);
console.log('✅ Created root .env');

console.log('\n🎉 Configuration complete!\n');
console.log('📋 Connection Details:');
console.log('   Cluster: coffeecluster.giagzlr.mongodb.net');
console.log('   Database: coffee-shop');
console.log('   Username: karimali1896_db_user\n');

console.log('🧪 Testing connection...\n');

// Test connection
try {
  const { connectDB } = await import('./src/db.js');
  await connectDB();
  console.log('✅ Successfully connected to MongoDB Atlas!\n');
  
  console.log('📋 Next steps:');
  console.log('   1. Seed database: pnpm seed');
  console.log('   2. Start server: cd ../.. && pnpm dev:all\n');
  
  process.exit(0);
} catch (error) {
  console.error('⚠️  Connection test failed:', error.message);
  console.log('\n💡 This might be because:');
  console.log('   1. Your IP needs to be whitelisted in Atlas');
  console.log('   2. The cluster is still starting up');
  console.log('   3. Network connectivity issue\n');
  console.log('To whitelist your IP:');
  console.log('   1. Go to https://cloud.mongodb.com/');
  console.log('   2. Network Access → Add IP Address');
  console.log('   3. Choose "Allow from anywhere" (0.0.0.0/0)\n');
  
  process.exit(1);
}

