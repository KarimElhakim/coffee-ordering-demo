import { useEffect, useState } from 'react';
import { getMenuItems, getModifiers, getItemImage, type Database } from '@coffee-demo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@coffee-demo/ui';
import { ItemModal } from '../components/ItemModal';
import { Coffee, Snowflake, Flame, Plus, ShoppingCart, PackageX } from 'lucide-react';
import { useCart } from '../store/cart';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
  modifiers: Array<{
    modifier: Database['public']['Tables']['modifiers']['Row'];
  }>;
};

export function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<Database['public']['Tables']['modifiers']['Row'][]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  // Subscribe to cart items - Zustand will trigger re-render when items change
  const cartItems = useCart((state) => state.items);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, allModifiers] = await Promise.all([
          getMenuItems(),
          getModifiers(),
        ]);
        setItems(menuItems as MenuItem[]);
        setModifiers(allModifiers);
        
        // Set initial tab to first available category
        if (menuItems.length > 0) {
          const firstCategory = (menuItems[0] as any).category || menuItems[0].station?.name || 'Other';
          setActiveTab(firstCategory);
        }
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Listen for item added events
    const handleItemAdded = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAddedItem(customEvent.detail?.itemId || null);
      setTimeout(() => setAddedItem(null), 2000);
    };
    window.addEventListener('itemAdded', handleItemAdded);
    return () => window.removeEventListener('itemAdded', handleItemAdded);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading menu...</p>
      </div>
    );
  }

  // Group by Starbucks category (or fall back to station for non-Starbucks items)
  const groupedByCategory = items.reduce((acc, item) => {
    const category = (item as any).category || item.station?.name || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);
  
  // Get all available categories
  const availableCategories = Object.keys(groupedByCategory).sort();

  // Handle Espresso special case - show popup to choose single or double
  const handleEspressoClick = () => {
    // Find the actual Espresso item from the items list
    const espressoItem = items.find(item => item.name === 'Espresso');
    if (espressoItem) {
      setSelectedItem(espressoItem);
    }
  };

  const renderMenuItems = (stationItems: MenuItem[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center w-full overflow-x-hidden">
        {stationItems.map((item) => {
          // Special handling for Espresso
          if (item.name === 'Espresso') {
            const itemInCart = cartItems.find(i => i.menu_item_id === item.id && i.name === 'Espresso');
            const isAdded = addedItem === item.id;
            const isOutOfStock = Boolean(item.out_of_stock || (item.track_inventory && (item.stock_quantity || 0) === 0));
            return (
              <Card 
                key={item.id} 
                className={`w-full max-w-[420px] h-[490px] ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'} transition-all duration-300 border-[3px] ${isOutOfStock ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'} bg-white dark:bg-gray-900 overflow-hidden group rounded-3xl flex flex-col ${isAdded ? 'ring-2 ring-gray-500 animate-pulse' : ''}`}
              >
                <div className="relative w-full h-[320px] overflow-hidden rounded-t-3xl flex items-center justify-center">
                  <img 
                    src={getItemImage(item.name)} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/000000/ffffff?text=' + encodeURIComponent(item.name);
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 rounded-full px-3 py-1.5 shadow-lg">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">From {item.base_price.toFixed(0)} EGP</span>
                  </div>
                  {itemInCart && (
                    <div className="absolute top-3 left-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full p-2 shadow-lg">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <CardHeader className="pb-3 pt-0 px-0">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                      Single or Double Shot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-0 px-0 mt-auto">
                    <Button
                      className={`w-full font-semibold shadow-lg transition-all duration-200 rounded-xl h-12 text-base hover:scale-105 active:scale-95 hover:shadow-xl ${
                        itemInCart 
                          ? 'bg-gray-700 hover:bg-gray-800 text-white' 
                          : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      } flex items-center justify-center`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Espresso clicked:', item);
                        handleEspressoClick();
                      }}
                    >
                      {itemInCart ? (
                        <>
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          In Cart ({itemInCart.qty})
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            );
          }

          // Regular items
          const itemInCart = cartItems.find(i => i.menu_item_id === item.id);
          const isAdded = addedItem === item.id || addedItem === item.name;
          const isOutOfStock = Boolean(item.out_of_stock || (item.track_inventory && (item.stock_quantity || 0) === 0));
          const isLowStock = !isOutOfStock && Boolean(item.track_inventory && (item.stock_quantity || 0) <= (item.low_stock_threshold || 10) && (item.stock_quantity || 0) > 0);
          return (
            <Card 
              key={item.id} 
              className={`w-full max-w-[420px] h-[490px] ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'} transition-all duration-300 border-[3px] ${isOutOfStock ? 'border-red-300 dark:border-red-700' : isLowStock ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'} bg-white dark:bg-gray-900 overflow-hidden group rounded-3xl flex flex-col ${isAdded ? 'ring-2 ring-gray-500 animate-pulse' : ''}`}
            >
              <div className="relative w-full h-[320px] overflow-hidden rounded-t-3xl flex items-center justify-center">
                <img 
                  src={getItemImage(item.name, item)} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/000000/ffffff?text=' + encodeURIComponent(item.name);
                  }}
                />
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 rounded-full px-3 py-1.5 shadow-lg">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.base_price.toFixed(0)} EGP</span>
                </div>
                {itemInCart && (
                  <div className="absolute top-3 left-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full p-2 shadow-lg">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <CardHeader className="pb-3 pt-0 px-0">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                    {item.station?.name} Station
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-0 px-0 mt-auto">
                  <Button
                    className={`w-full font-semibold shadow-lg transition-all duration-200 rounded-xl h-12 text-base hover:scale-105 active:scale-95 hover:shadow-xl ${
                      isOutOfStock 
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                        : itemInCart 
                        ? 'bg-gray-700 hover:bg-gray-800 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                    } flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        console.log('🛒 Menu item clicked:', item.name, item);
                        setSelectedItem(item);
                        console.log('🛒 selectedItem set to:', item);
                      }
                    }}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? (
                      <>
                        <PackageX className="h-5 w-5 mr-2" />
                        Out of Stock
                      </>
                    ) : itemInCart ? (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        In Cart ({itemInCart.qty})
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] overflow-x-hidden">
      {/* Animated Starbucks-Style Hero Banner */}
      <div className="relative w-full h-[450px] sm:h-[550px] lg:h-[650px] overflow-hidden mb-12">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900" />
        
        {/* Animated coffee beans pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-white animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-20 left-1/4 w-28 h-28 rounded-full bg-white animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          <div className="absolute bottom-32 right-1/3 w-20 h-20 rounded-full bg-white animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
        </div>

        {/* Starbucks-style curved decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
        
        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          {/* Animated main title */}
          <div className="mb-6 animate-fade-in-down">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-2 tracking-tight" 
                style={{ 
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.2)'
                }}>
              <span className="inline-block animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Welcome</span>
              {' '}
              <span className="inline-block animate-fade-in-up" style={{ animationDelay: '0.3s' }}>to</span>
            </h1>
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white animate-fade-in-up"
                style={{ 
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  textShadow: '0 4px 30px rgba(0,0,0,0.6), 0 0 60px rgba(255,255,255,0.3)',
                  animationDelay: '0.5s',
                  letterSpacing: '-0.02em'
                }}>
              Karim's <span className="text-yellow-300">Coffee</span>
            </h2>
          </div>
          
          {/* Animated subtitle */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-white font-medium max-w-3xl mb-8 animate-fade-in-up leading-relaxed"
             style={{ 
               animationDelay: '0.7s',
               textShadow: '0 2px 15px rgba(0,0,0,0.5)'
             }}>
            Experience the <span className="font-bold text-yellow-300">authentic Starbucks</span> menu
            <br />
            <span className="text-lg sm:text-xl text-emerald-100">Handcrafted beverages • Fresh daily • Made with love</span>
          </p>

          {/* Animated badge */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl">
              <Coffee className="h-5 w-5 text-emerald-700" />
              <span className="text-emerald-800 font-bold text-lg">99 Premium Beverages</span>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Our Menu
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Discover our handcrafted coffee selection</p>
        </div>
        
        <div className="flex justify-center mb-8 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl overflow-x-hidden">
            <TabsList className={`grid w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-1 h-auto overflow-x-auto`} style={{ gridTemplateColumns: `repeat(${availableCategories.length}, minmax(120px, 1fr))` }}>
              {availableCategories.map((category) => {
                const icon = 
                  category.includes('Hot Coffee') ? <Flame className="h-4 w-4" /> :
                  category.includes('Hot Tea') ? <Flame className="h-4 w-4" /> :
                  category.includes('Cold Coffee') || category.includes('Iced') ? <Snowflake className="h-4 w-4" /> :
                  category.includes('Frappuccino') ? <Snowflake className="h-4 w-4" /> :
                  <Coffee className="h-4 w-4" />;
                
                // Shorten long category names for display
                const displayName = 
                  category === 'Frappuccino® Blended Beverage' ? 'Frappuccino®' :
                  category;
                
                return (
                  <TabsTrigger 
                    key={category}
                    value={category} 
                    className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:z-10 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 data-[state=inactive]:hover:scale-[1.02] active:scale-95 data-[state=inactive]:hover:text-gray-900 dark:data-[state=inactive]:hover:text-white relative px-3 py-2"
                  >
                    {icon}
                    <span className="text-sm">{displayName}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {availableCategories.map((category) => (
              <TabsContent key={category} value={category} className="mt-6 overflow-x-hidden">
                {groupedByCategory[category] ? renderMenuItems(groupedByCategory[category]) : (
                  <div className="text-center py-12 text-gray-600 dark:text-gray-400">No {category} drinks available</div>
                )}
              </TabsContent>
            ))}
        </Tabs>
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          modifiers={modifiers}
          onClose={() => setSelectedItem(null)}
          onAdd={() => {
            setSelectedItem(null);
            setAddedItem(selectedItem.id);
            setTimeout(() => setAddedItem(null), 2000);
          }}
        />
      )}
    </div>
  );
}
