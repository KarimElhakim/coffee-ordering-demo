#!/usr/bin/env node

/**
 * Automated MongoDB Atlas Connection String Retriever
 * This script uses Playwright to automate browser interactions
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function automateAtlasSetup() {
  console.log('\n🤖 MongoDB Atlas Connection String Automation');
  console.log('==============================================\n');
  
  console.log('This script will:');
  console.log('✅ Open MongoDB Atlas in a browser');
  console.log('✅ Help you log in');
  console.log('✅ Navigate to your cluster');
  console.log('✅ Extract the connection string');
  console.log('✅ Save it to .env automatically\n');
  
  const proceed = await ask('Ready to start? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\n👋 Cancelled. Run this script again when ready.\n');
    process.exit(0);
  }
  
  console.log('\n🌐 Launching browser...\n');
  
  // Launch browser in non-headless mode so user can see and interact
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to MongoDB Atlas
    console.log('📍 Navigating to MongoDB Atlas...');
    await page.goto('https://cloud.mongodb.com/');
    await page.waitForLoadState('networkidle');
    
    console.log('\n✅ MongoDB Atlas loaded!');
    console.log('\n📝 Please log in to your account in the browser window.');
    console.log('   (The script will wait for you to complete login)\n');
    
    // Wait for user to log in - check for dashboard
    await page.waitForURL('**/v2/*', { timeout: 300000 }); // 5 minute timeout
    
    console.log('✅ Login successful!\n');
    
    // Give the dashboard time to load
    await page.waitForTimeout(3000);
    
    // Step 2: Try to find clusters
    console.log('🔍 Looking for your database clusters...\n');
    
    // Wait for clusters to load
    try {
      await page.waitForSelector('text=Clusters', { timeout: 10000 });
    } catch (e) {
      // Might already be on clusters page
    }
    
    // Try to click on a cluster or get to the database view
    try {
      // Look for "Database" in the sidebar
      const databaseLink = page.locator('text=Database').first();
      if (await databaseLink.isVisible()) {
        console.log('📊 Navigating to Database view...');
        await databaseLink.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Already on database page');
    }
    
    // Step 3: Find and click "Connect" button
    console.log('🔗 Looking for Connect button...\n');
    
    await page.waitForTimeout(2000);
    
    // Take a screenshot to help debug
    await page.screenshot({ path: join(__dirname, 'atlas-dashboard.png') });
    console.log('📸 Screenshot saved to: atlas-dashboard.png\n');
    
    // Look for Connect button
    const connectButtons = await page.locator('button:has-text("Connect"), a:has-text("Connect")').all();
    
    if (connectButtons.length === 0) {
      console.log('⚠️  Could not find Connect button automatically.');
      console.log('\n📝 Please manually:');
      console.log('   1. Click on your cluster');
      console.log('   2. Click "Connect"');
      console.log('   3. Choose "Connect your application"');
      
      await ask('\nPress Enter when you see the connection string on screen...');
    } else {
      console.log(`✅ Found ${connectButtons.length} Connect button(s). Clicking the first one...`);
      await connectButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Click "Connect your application"
      try {
        const connectAppButton = page.locator('text=Connect your application, text=Drivers').first();
        if (await connectAppButton.isVisible({ timeout: 5000 })) {
          console.log('📱 Clicking "Connect your application"...');
          await connectAppButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        console.log('Please select "Connect your application" in the modal');
        await page.waitForTimeout(3000);
      }
    }
    
    // Step 4: Find connection string
    console.log('🔍 Searching for connection string...\n');
    
    await page.waitForTimeout(2000);
    
    // Look for the connection string input/text field
    const connectionStringElement = await page.locator('input[value*="mongodb+srv"], input[value*="mongodb://"], code:has-text("mongodb+srv"), code:has-text("mongodb://")').first();
    
    let connectionString = '';
    
    try {
      // Try to get value from input
      connectionString = await connectionStringElement.inputValue().catch(async () => {
        // If not an input, get text content
        return await connectionStringElement.textContent();
      });
      
      if (connectionString) {
        console.log('✅ Connection string found!\n');
        console.log('🔗 Connection string:');
        console.log('   ' + connectionString.substring(0, 50) + '...\n');
      }
    } catch (e) {
      console.log('⚠️  Could not extract connection string automatically.\n');
      console.log('📝 Please copy the connection string from the page.\n');
      connectionString = await ask('Paste your connection string here: ');
    }
    
    if (!connectionString || !connectionString.includes('mongodb')) {
      console.log('\n❌ Invalid connection string. Please copy it manually:');
      connectionString = await ask('Paste your MongoDB Atlas connection string: ');
    }
    
    // Step 5: Get cluster name/password info
    console.log('\n🔐 Configuration...\n');
    
    let finalString = connectionString.trim();
    
    // Check if password placeholder exists
    if (finalString.includes('<password>')) {
      console.log('⚠️  Connection string contains <password> placeholder.');
      const password = await ask('Enter your database user password: ');
      finalString = finalString.replace('<password>', password);
    }
    
    // Ensure database name
    if (!finalString.includes('/coffee-shop')) {
      console.log('📝 Adding database name (coffee-shop)...');
      if (finalString.includes('?')) {
        finalString = finalString.replace(/\/\?/, '/coffee-shop?');
      } else {
        finalString = finalString.replace(/\/$/, '') + '/coffee-shop?retryWrites=true&w=majority';
      }
    }
    
    // Step 6: Save to .env
    console.log('\n💾 Saving configuration...\n');
    
    const envContent = `PORT=3001
MONGODB_URI=${finalString}
NODE_ENV=development
`;
    
    const envPath = join(__dirname, '.env');
    writeFileSync(envPath, envContent);
    
    console.log('✅ Configuration saved to .env\n');
    
    // Step 7: Test connection
    console.log('🧪 Testing connection...\n');
    
    try {
      const { connectDB } = await import('./src/db.js');
      await connectDB();
      console.log('✅ Successfully connected to MongoDB Atlas!\n');
      
      console.log('🎉 Setup complete! Next steps:');
      console.log('   1. Seed database: cd ../.. && pnpm seed');
      console.log('   2. Start app: pnpm dev:all\n');
    } catch (error) {
      console.error('⚠️  Connection test failed:', error.message);
      console.log('\nYou can test manually later with: pnpm test:connection\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    console.error('\n💡 You can:');
    console.error('   1. Try running the script again');
    console.error('   2. Use the manual setup: pnpm setup:atlas');
    console.error('   3. Follow the guide: MONGODB_ATLAS_SETUP.md\n');
  } finally {
    console.log('\n👋 Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    rl.close();
  }
}

automateAtlasSetup().catch(console.error);

