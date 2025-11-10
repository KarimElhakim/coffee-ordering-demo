import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://www.starbucks.com';
const OUTPUT_DIR = path.join(__dirname, '../scraped-data');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// Create output directories
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Categories to scrape - focusing on key categories for reliability
const DRINK_CATEGORIES = [
  { name: 'Hot Coffee', url: '/menu/drinks/hot-coffee' },
  { name: 'Cold Coffee', url: '/menu/drinks/cold-coffee' },
  { name: 'Frappuccino® Blended Beverage', url: '/menu/drinks/frappuccino-blended-beverage' },
  { name: 'Hot Tea', url: '/menu/drinks/hot-tea' }
];

/**
 * Download image from URL
 */
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Check if already downloaded
    if (fs.existsSync(filepath)) {
      console.log(`  ✓ Image already exists: ${filename}`);
      resolve(filepath);
      return;
    }

    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  ✓ Downloaded image: ${filename}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      console.error(`  ✗ Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
}

/**
 * Scrape individual drink details
 */
async function scrapeDrinkDetails(page, drinkUrl, drinkName, category) {
  try {
    console.log(`  🔍 Scraping: ${drinkName}...`);
    
    await page.goto(`${BASE_URL}${drinkUrl}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the product title to be visible
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
    } catch (err) {
      console.log(`  ⚠ Title not found for ${drinkName}`);
    }
    
    await page.waitForTimeout(3000); // Extra time for dynamic content

    // Extract all data
    const drinkData = await page.evaluate(() => {
      const data = {
        name: '',
        description: '',
        imageUrl: '',
        calories: null,
        nutritionInfo: {},
        sizes: [],
        customizations: {},
        stars: null
      };

      // Name
      const nameElement = document.querySelector('h1');
      if (nameElement) data.name = nameElement.textContent.trim();

      // Description
      const descElement = document.querySelector('complementary[role="complementary"] p:nth-of-type(2)');
      if (descElement) data.description = descElement.textContent.trim();

      // Image - try multiple selectors
      const imgElement = document.querySelector('img[alt*="Caffè"], img[alt*="Coffee"], img[alt*="Latte"], img[alt*="Mocha"], main img, [class*="product"] img');
      if (imgElement) {
        data.imageUrl = imgElement.src || imgElement.getAttribute('src');
      }

      // Calories - search in the whole page text
      const allText = document.body.textContent;
      const caloriesMatch = allText.match(/(\d+)\s*calories/i);
      if (caloriesMatch) {
        data.calories = parseInt(caloriesMatch[1]);
      }

      // Nutrition info (calories, sugar, fat) - search more broadly
      const nutritionElements = Array.from(document.querySelectorAll('p, div, span'));
      for (const el of nutritionElements) {
        const text = el.textContent;
        if (text.includes('calories') && text.includes('sugar') && text.includes('fat')) {
          const caloriesMatch = text.match(/(\d+)\s*calories/i);
          const sugarMatch = text.match(/(\d+)g?\s*sugar/i);
          const fatMatch = text.match(/(\d+)g?\s*fat/i);
          
          if (caloriesMatch) data.nutritionInfo.calories = parseInt(caloriesMatch[1]);
          if (sugarMatch) data.nutritionInfo.sugar_g = parseInt(sugarMatch[1]);
          if (fatMatch) data.nutritionInfo.fat_g = parseInt(fatMatch[1]);
          break;
        }
      }

      // Stars - search for elements containing "Stars"
      const allElements = Array.from(document.querySelectorAll('p, div, span'));
      for (const el of allElements) {
        if (el.textContent.includes('Stars')) {
          const match = el.textContent.match(/(\d+)/);
          if (match) {
            data.stars = parseInt(match[1]);
            break;
          }
        }
      }

      // Sizes
      const sizeElements = document.querySelectorAll('input[type="radio"]');
      sizeElements.forEach(radio => {
        const label = radio.parentElement?.querySelector('p');
        if (label) {
          data.sizes.push(label.textContent.trim());
        }
      });

      // Customizations
      const selectElements = document.querySelectorAll('select, [role="combobox"]');
      selectElements.forEach(select => {
        const label = select.parentElement?.querySelector('label, [class*="label"]');
        if (label) {
          const categoryName = label.textContent.trim();
          const options = [];
          
          const optionElements = select.querySelectorAll('option');
          optionElements.forEach(opt => {
            if (opt.value && !opt.disabled) {
              options.push(opt.textContent.trim());
            }
          });
          
          if (options.length > 0) {
            data.customizations[categoryName] = options;
          }
        }
      });

      return data;
    });

    // Download image if available
    if (drinkData.imageUrl && drinkData.imageUrl.startsWith('http')) {
      const imageFilename = `${drinkData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      try {
        await downloadImage(drinkData.imageUrl, imageFilename);
        drinkData.localImagePath = `/images/${imageFilename}`;
      } catch (err) {
        console.error(`  ✗ Failed to download image for ${drinkData.name}`);
      }
    }

    console.log(`  ✓ Scraped: ${drinkData.name} (${drinkData.calories || 0} cal)`);
    return {
      ...drinkData,
      category,
      url: drinkUrl,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`  ✗ Error scraping ${drinkName}:`, error.message);
    return null;
  }
}

/**
 * Scrape all drinks in a category
 */
async function scrapeCategory(page, category) {
  try {
    console.log(`\n📂 Scraping category: ${category.name}`);
    
    await page.goto(`${BASE_URL}${category.url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Get all drink links
    const drinkLinks = await page.evaluate(() => {
      const links = [];
      const linkElements = document.querySelectorAll('a[href*="/menu/product/"]');
      
      linkElements.forEach(link => {
        const href = link.getAttribute('href');
        const name = link.textContent.trim();
        
        if (href && name && !links.find(l => l.url === href)) {
          links.push({ url: href, name });
        }
      });
      
      return links;
    });

    console.log(`  Found ${drinkLinks.length} drinks`);

    // Scrape each drink
    const drinks = [];
    for (const link of drinkLinks) {
      const drinkData = await scrapeDrinkDetails(page, link.url, link.name, category.name);
      if (drinkData) {
        drinks.push(drinkData);
      }
      await page.waitForTimeout(500); // Be respectful to the server
    }

    return drinks;

  } catch (error) {
    console.error(`✗ Error scraping category ${category.name}:`, error.message);
    return [];
  }
}

/**
 * Main scraper function
 */
async function scrapeStarbucksMenu() {
  console.log('🚀 Starting Starbucks Menu Scraper...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const allDrinks = [];

  try {
    // Accept cookies
    try {
      await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle' });
      const agreeButton = await page.locator('button:has-text("Agree")').first();
      if (await agreeButton.isVisible()) {
        await agreeButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (err) {
      console.log('No cookie banner found or already accepted');
    }

    // Scrape each category
    for (const category of DRINK_CATEGORIES) {
      try {
        const drinks = await scrapeCategory(page, category);
        allDrinks.push(...drinks);
        
        console.log(`✓ Completed: ${category.name} (${drinks.length} drinks)\n`);
        
        // Save progress after each category
        const progressFile = path.join(OUTPUT_DIR, 'starbucks-menu.json');
        fs.writeFileSync(progressFile, JSON.stringify(allDrinks, null, 2));
        console.log(`💾 Progress saved (${allDrinks.length} drinks so far)\n`);
      } catch (error) {
        console.error(`❌ Error scraping ${category.name}:`, error);
        console.log('Continuing with next category...\n');
      }
    }

    // Save all data
    const outputFile = path.join(OUTPUT_DIR, 'starbucks-menu.json');
    fs.writeFileSync(outputFile, JSON.stringify(allDrinks, null, 2));
    
    console.log(`\n✅ Scraping complete!`);
    console.log(`📊 Total drinks scraped: ${allDrinks.length}`);
    console.log(`📁 Data saved to: ${outputFile}`);
    console.log(`🖼️  Images saved to: ${IMAGES_DIR}`);

    // Generate summary
    const summary = {
      totalDrinks: allDrinks.length,
      categories: {},
      scrapedAt: new Date().toISOString()
    };

    allDrinks.forEach(drink => {
      if (!summary.categories[drink.category]) {
        summary.categories[drink.category] = 0;
      }
      summary.categories[drink.category]++;
    });

    const summaryFile = path.join(OUTPUT_DIR, 'summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log(`\n📋 Summary:`);
    Object.entries(summary.categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} drinks`);
    });

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await browser.close();
  }

  return allDrinks;
}

export { scrapeStarbucksMenu };

// Run immediately when executed
console.log('🎬 Script loaded, starting scraper...');
scrapeStarbucksMenu()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Scraper failed:', err);
    console.error(err.stack);
    process.exit(1);
  });

