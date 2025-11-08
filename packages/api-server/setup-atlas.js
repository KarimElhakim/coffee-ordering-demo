#!/usr/bin/env node

import { createInterface } from 'readline';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function setup() {
  console.log('\n🌐 MongoDB Atlas Configuration Setup');
  console.log('=====================================\n');
  console.log('This script will help you configure MongoDB Atlas for your coffee shop app.\n');
  console.log('📋 Before you start, make sure you have:');
  console.log('   1. Created a MongoDB Atlas account at https://cloud.mongodb.com');
  console.log('   2. Created a free cluster');
  console.log('   3. Created a database user');
  console.log('   4. Allowed network access (IP whitelist)');
  console.log('   5. Obtained your connection string\n');
  
  const ready = await ask('Are you ready to continue? (yes/no): ');
  
  if (ready.toLowerCase() !== 'yes' && ready.toLowerCase() !== 'y') {
    console.log('\n📖 Please follow the setup guide in MONGODB_ATLAS_SETUP.md first.');
    console.log('   Then run this script again.\n');
    process.exit(0);
  }
  
  console.log('\n📝 Getting your connection string...\n');
  console.log('To get your connection string:');
  console.log('   1. Go to https://cloud.mongodb.com');
  console.log('   2. Click on your cluster');
  console.log('   3. Click "Connect"');
  console.log('   4. Choose "Connect your application"');
  console.log('   5. Copy the connection string\n');
  console.log('Example: mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/\n');
  
  const connectionString = await ask('Paste your MongoDB Atlas connection string: ');
  
  // Validate connection string
  if (!connectionString.includes('mongodb+srv://') && !connectionString.includes('mongodb://')) {
    console.error('\n❌ Invalid connection string!');
    console.error('   Connection string should start with mongodb+srv:// or mongodb://\n');
    process.exit(1);
  }
  
  // Check if password placeholder exists
  if (connectionString.includes('<password>')) {
    console.log('\n⚠️  Warning: Your connection string contains <password> placeholder.');
    const password = await ask('Enter your database user password: ');
    var finalString = connectionString.replace('<password>', password);
  } else {
    var finalString = connectionString.trim();
  }
  
  // Ensure database name is included
  if (!finalString.includes('coffee-shop')) {
    console.log('\n📝 Adding database name to connection string...');
    
    // Check if there's a query string
    if (finalString.includes('?')) {
      // Insert database name before query string
      finalString = finalString.replace(/\/\?/, '/coffee-shop?');
    } else {
      // Add database name and query string
      finalString = finalString.replace(/\/$/, '') + '/coffee-shop?retryWrites=true&w=majority';
      if (!finalString.includes('?')) {
        finalString += '?retryWrites=true&w=majority';
      }
    }
  }
  
  // Ensure query parameters exist
  if (!finalString.includes('retryWrites=true')) {
    finalString += finalString.includes('?') ? '&retryWrites=true' : '?retryWrites=true';
  }
  if (!finalString.includes('w=majority')) {
    finalString += '&w=majority';
  }
  
  console.log('\n🔧 Creating .env file...');
  
  // Create .env file
  const envContent = `PORT=3001
MONGODB_URI=${finalString}
NODE_ENV=development
`;
  
  const envPath = join(__dirname, '.env');
  writeFileSync(envPath, envContent);
  
  console.log('✅ Configuration saved to packages/api-server/.env\n');
  
  // Ask if they want to test connection now
  const testNow = await ask('Would you like to test the connection now? (yes/no): ');
  
  if (testNow.toLowerCase() === 'yes' || testNow.toLowerCase() === 'y') {
    console.log('\n🧪 Testing MongoDB Atlas connection...\n');
    
    try {
      // Dynamic import to test connection
      const { connectDB } = await import('./src/db.js');
      await connectDB();
      console.log('✅ Successfully connected to MongoDB Atlas!\n');
      process.exit(0);
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check your username and password are correct');
      console.error('   2. Ensure your IP address is whitelisted in Atlas');
      console.error('   3. Verify the cluster is running');
      console.error('   4. Check your internet connection\n');
      process.exit(1);
    }
  } else {
    console.log('\n📋 Next steps:');
    console.log('   1. Test connection: pnpm test:connection');
    console.log('   2. Seed database: cd ../.. && pnpm seed');
    console.log('   3. Start app: pnpm dev:all');
    console.log('\n🎉 Setup complete!\n');
    process.exit(0);
  }
  
  rl.close();
}

setup().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  console.error('\n📖 Please see MONGODB_ATLAS_SETUP.md for detailed instructions.\n');
  process.exit(1);
});

