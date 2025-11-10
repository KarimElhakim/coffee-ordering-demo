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
  const [activeTab, setActiveTab] = useState('Bar');

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, allModifiers] = await Promise.all([
          getMenuItems(),
          getModifiers(),
        ]);
        setItems(menuItems as MenuItem[]);
        setModifiers(allModifiers);
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

  const groupedByStation = items.reduce((acc, item) => {
    const stationName = item.station?.name || 'Other';
    if (!acc[stationName]) acc[stationName] = [];
    acc[stationName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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
                className={`w-full max-w-[420px] ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'} transition-all duration-300 border-[3px] ${isOutOfStock ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'} bg-white dark:bg-gray-900 overflow-hidden group rounded-3xl flex flex-col ${isAdded ? 'ring-2 ring-gray-500 animate-pulse' : ''}`}
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
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white dark:via-gray-900/20 dark:to-gray-900"></div>
                  <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 rounded-full px-3 py-1.5 shadow-lg">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">From {item.base_price.toFixed(0)} EGP</span>
                  </div>
                  {itemInCart && (
                    <div className="absolute top-3 left-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full p-2 shadow-lg">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-shrink-0">
                  <CardHeader className="pb-3 pt-0 px-0">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                      Single or Double Shot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-0 px-0">
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
              className={`w-full max-w-[420px] ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'} transition-all duration-300 border-[3px] ${isOutOfStock ? 'border-red-300 dark:border-red-700' : isLowStock ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'} bg-white dark:bg-gray-900 overflow-hidden group rounded-3xl flex flex-col ${isAdded ? 'ring-2 ring-gray-500 animate-pulse' : ''}`}
            >
              <div className="relative w-full h-[320px] overflow-hidden rounded-t-3xl flex items-center justify-center">
                <img 
                  src={getItemImage(item.name, item)} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/f59e0b/ffffff?text=' + encodeURIComponent(item.name);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white dark:via-gray-900/20 dark:to-gray-900"></div>
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 rounded-full px-3 py-1.5 shadow-lg">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.base_price.toFixed(0)} EGP</span>
                </div>
                {itemInCart && (
                  <div className="absolute top-3 left-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full p-2 shadow-lg">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-shrink-0">
                <CardHeader className="pb-3 pt-0 px-0">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                    {item.station?.name} Station
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-0 px-0">
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
      {/* Hero Section */}
      <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden mb-12">
        <img 
          src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2060&q=80"
          alt="Coffee shop interior with people"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-800/60 to-gray-900/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/90 backdrop-blur-[1px]" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            Welcome to Karim's Coffee
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 max-w-2xl drop-shadow-lg">
            Discover our handcrafted coffee selection and experience the perfect blend
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Our Menu
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Discover our handcrafted coffee selection</p>
        </div>
        
        <div className="flex justify-center mb-8 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl overflow-x-hidden">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 h-12 overflow-x-hidden relative">
              <TabsTrigger 
                value="Bar" 
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:z-10 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 data-[state=inactive]:hover:scale-[1.02] active:scale-95 data-[state=inactive]:hover:text-gray-900 dark:data-[state=inactive]:hover:text-white relative"
              >
                <Coffee className="h-4 w-4 transition-transform duration-200" />
                <span>Coffee Drinks</span>
              </TabsTrigger>
            <TabsTrigger 
              value="Hot" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:z-10 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 data-[state=inactive]:hover:scale-[1.02] active:scale-95 data-[state=inactive]:hover:text-gray-900 dark:data-[state=inactive]:hover:text-white relative"
            >
              <Flame className="h-4 w-4 transition-transform duration-200" />
              <span>Hot Drinks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="Cold" 
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:z-10 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 data-[state=inactive]:hover:scale-[1.02] active:scale-95 data-[state=inactive]:hover:text-gray-900 dark:data-[state=inactive]:hover:text-white relative"
            >
              <Snowflake className="h-4 w-4 transition-transform duration-200" />
              <span>Cold Drinks</span>
            </TabsTrigger>
          </TabsList>

            <TabsContent value="Bar" className="mt-6 overflow-x-hidden">
              {groupedByStation['Bar'] ? renderMenuItems(groupedByStation['Bar']) : (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">No Coffee drinks available</div>
              )}
            </TabsContent>

            <TabsContent value="Hot" className="mt-6 overflow-x-hidden">
              {groupedByStation['Hot'] ? renderMenuItems(groupedByStation['Hot']) : (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">No Hot drinks available</div>
              )}
            </TabsContent>

            <TabsContent value="Cold" className="mt-6 overflow-x-hidden">
              {groupedByStation['Cold'] ? renderMenuItems(groupedByStation['Cold']) : (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">No Cold drinks available</div>
              )}
            </TabsContent>
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
