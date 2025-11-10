// High quality Unsplash images for menu items - each item has a unique image
// Using high resolution images (w=800) for better quality

const ITEM_IMAGES: Record<string, string> = {
  'Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&h=800&fit=crop&q=90',
  'Cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop&q=90',
  'Caffè Latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop&q=90',
  'Americano': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop&q=90',
  'Macchiato': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=800&fit=crop&q=90',
  'Flat White': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop&q=90',
  'Mocha': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop&q=90',
  'Hot Chocolate': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&h=800&fit=crop&q=90',
  'Chai Latte': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&h=800&fit=crop&q=90',
  'Matcha Latte': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop&q=90',
  'Turkish Coffee': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop&q=90',
  'Iced Latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop&q=90',
  'Iced Americano': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop&q=90',
  'Cold Brew': 'https://images.unsplash.com/photo-1523371054106-47f2b862905e?w=800&h=800&fit=crop&q=90',
  'Frappuccino': 'https://images.unsplash.com/photo-1571934800179-f7777e02213e?w=800&h=800&fit=crop&q=90',
  'Iced Mocha': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop&q=90',
  'Fruit Smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=800&fit=crop&q=90',
};

export function getItemImage(itemName: string, item?: any): string {
  // Priority 1: Use Starbucks CDN image URL from the item data
  if (item?.image_url) {
    return item.image_url;
  }
  
  // Priority 2: Use local served image from scraper
  if (item?.local_image_path) {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    return `${apiUrl}${item.local_image_path}`;
  }
  
  // Priority 3: Fall back to hardcoded Unsplash images
  if (ITEM_IMAGES[itemName]) {
    return ITEM_IMAGES[itemName];
  }
  
  // Priority 4: Default placeholder
  return 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop&q=90';
}

