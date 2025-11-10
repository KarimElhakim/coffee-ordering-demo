import https from 'https';
import fs from 'fs';

function fetchWithRetry(url, retries = 5, delay = 2000) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      console.log(`Attempting to fetch from ${url} (${n} retries left)...`);
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              console.log(`✅ Successfully fetched ${parsed.length || 1} items`);
              resolve(parsed);
            } catch (e) {
              console.error(`Parse error: ${e.message}`);
              if (n > 0) {
                console.log(`Retrying in ${delay}ms...`);
                setTimeout(() => attempt(n - 1), delay);
              } else {
                reject(e);
              }
            }
          } else {
            console.error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
            if (n > 0) {
              console.log(`Retrying in ${delay}ms...`);
              setTimeout(() => attempt(n - 1), delay);
            } else {
              reject(new Error(`Failed with status ${res.statusCode}`));
            }
          }
        });
      }).on('error', (err) => {
        console.error(`Connection error: ${err.message}`);
        if (n > 0) {
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => attempt(n - 1), delay);
        } else {
          reject(err);
        }
      });
    };
    
    attempt(retries);
  });
}

async function fetchCoffeeProducts() {
  try {
    console.log('🔄 Fetching coffee products from Fake Coffee API...\n');
    
    const products = await fetchWithRetry('https://fake-coffee-api.vercel.app/api');
    
    console.log(`\n✅ Fetched ${products.length} coffee products`);
    console.log('\nSample product:');
    console.log(JSON.stringify(products[0], null, 2));
    
    // Save to file
    fs.writeFileSync(
      'coffee-api-data.json',
      JSON.stringify(products, null, 2)
    );
    
    console.log('\n✅ Saved to coffee-api-data.json');
    
    return products;
  } catch (error) {
    console.error('\n❌ Error fetching coffee products:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
fetchCoffeeProducts();

