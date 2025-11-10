// Fetch data from Fake Coffee API
const https = require('https');
const fs = require('fs');

https.get('https://fake-coffee-api.vercel.app/api', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const products = JSON.parse(data);
    console.log('✅ Fetched', products.length, 'coffee products from API');
    console.log('\n📦 Sample product structure:');
    console.log(JSON.stringify(products[0], null, 2));
    console.log('\n📝 All products:');
    console.log(JSON.stringify(products, null, 2));
    
    // Save to file
    fs.writeFileSync('coffee-api-data.json', JSON.stringify(products, null, 2));
    console.log('\n✅ Saved to coffee-api-data.json');
  });
}).on('error', (err) => {
  console.error('❌ Error:', err);
});

