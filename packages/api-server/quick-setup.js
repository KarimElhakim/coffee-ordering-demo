#!/usr/bin/env node

/**
 * Quick MongoDB Atlas Setup
 * 
 * Simple script that guides you to get the connection string
 * No browser automation - just copy/paste!
 */

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

async function quickSetup() {
  console.log('\n☁️  MongoDB Atlas Quick Setup');
  console.log('============================\n');
  
  console.log('This is the EASIEST way to connect to MongoDB Atlas!\n');
  console.log('Just 3 steps:\n');
  console.log('1. Get your connection string from Atlas');
  console.log('2. Paste it here');
  console.log('3. Done! 🎉\n');
  
  const proceed = await ask('Ready to start? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\n👋 Cancelled.\n');
    process.exit(0);
  }
  
  console.log('\n📋 Instructions:\n');
  console.log('1. Open https://cloud.mongodb.com in your regular Chrome browser');
  console.log('2. Log in with your account');
  console.log('3. Click on your cluster (or create one if you don\'t have one)');
  console.log('4. Click the "Connect" button');
  console.log('5. Choose "Connect your application"');
  console.log('6. Copy the connection string (starts with mongodb+srv://)\n');
  
  const openNow = await ask('Do you want me to open Atlas for you? (yes/no): ');
  
  if (openNow.toLowerCase() === 'yes' || openNow.toLowerCase() === 'y') {
    console.log('\n🌐 Opening MongoDB Atlas in your default browser...\n');
    const { exec } = await import('child_process');
    const url = 'https://cloud.mongodb.com';
    
    // Open in default browser
    const platform = process.platform;
    if (platform === 'win32') {
      exec(`start ${url}`);
    } else if (platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
    
    console.log('✅ Browser opened! Please log in and get your connection string.\n');
  }
  
  console.log('Waiting for your connection string...\n');
  const connectionString = await ask('Paste your MongoDB Atlas connection string here: ');
  
  if (!connectionString || !connectionString.includes('mongodb')) {
    console.log('\n❌ Invalid connection string. Please try again.\n');
    process.exit(1);
  }
  
  console.log('\n✅ Connection string received!\n');
  
  // Process the connection string
  let finalString = connectionString.trim();
  
  // Check for password placeholder
  if (finalString.includes('<password>')) {
    console.log('⚠️  Your connection string contains <password> placeholder.\n');
    const password = await ask('Enter your database user password: ');
    finalString = finalString.replace('<password>', password);
  }
  
  // Add database name if not present
  if (!finalString.includes('/coffee-shop')) {
    console.log('\n📝 Adding database name (coffee-shop)...');
    if (finalString.includes('?')) {
      finalString = finalString.replace(/\/\?/, '/coffee-shop?');
    } else {
      finalString = finalString.replace(/\/$/, '') + '/coffee-shop?retryWrites=true&w=majority';
    }
  }
  
  // Ensure query parameters
  if (!finalString.includes('retryWrites=true')) {
    finalString += finalString.includes('?') ? '&retryWrites=true' : '?retryWrites=true';
  }
  if (!finalString.includes('w=majority')) {
    finalString += '&w=majority';
  }
  
  console.log('\n💾 Saving configuration...\n');
  
  // Save to .env
  const envContent = `PORT=3001
MONGODB_URI=${finalString}
NODE_ENV=development
`;
  
  const envPath = join(__dirname, '.env');
  writeFileSync(envPath, envContent);
  
  console.log('✅ Configuration saved to .env\n');
  
  // Test connection
  console.log('🧪 Testing connection...\n');
  
  try {
    const { connectDB } = await import('./src/db.js');
    await connectDB();
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    // Ask to seed
    const seedNow = await ask('Would you like to seed the database now? (yes/no): ');
    
    if (seedNow.toLowerCase() === 'yes' || seedNow.toLowerCase() === 'y') {
      console.log('\n🌱 Seeding database...\n');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync('pnpm seed', { cwd: join(__dirname, '../..') });
        console.log(result.stdout);
        console.log('\n✅ Database seeded successfully!\n');
      } catch (error) {
        console.log('⚠️  Seeding failed. You can run it manually: cd ../.. && pnpm seed\n');
      }
    }
    
    console.log('\n🎉 SETUP COMPLETE!\n');
    console.log('Your app is now connected to MongoDB Atlas!\n');
    console.log('📋 Next steps:');
    console.log('   1. cd ../.. (go to root)');
    console.log('   2. pnpm dev:all (start all apps)\n');
    console.log('🌐 Your apps will be at:');
    console.log('   - API: http://localhost:3001');
    console.log('   - Customer: http://localhost:5173');
    console.log('   - Cashier: http://localhost:5174');
    console.log('   - KDS: http://localhost:5175');
    console.log('   - Dashboard: http://localhost:5176\n');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   1. Wrong password in connection string');
    console.log('   2. IP not whitelisted (add 0.0.0.0/0 in Atlas)');
    console.log('   3. Cluster not ready yet (wait 1-2 minutes)\n');
    console.log('You can test manually later: pnpm test:connection\n');
  }
  
  rl.close();
}

quickSetup().catch(console.error);

