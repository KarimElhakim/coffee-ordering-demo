import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../store/cart';
import { Coffee, MapPin, ShoppingBag } from 'lucide-react';
import { CartSidebar } from './CartSidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [searchParams] = useSearchParams();
  // Subscribe to cart state - Zustand will trigger re-render when items change
  const tableId = useCart((state) => state.tableId);
  const setTableId = useCart((state) => state.setTableId);
  const items = useCart((state) => state.items);
  // Subscribe to items to trigger re-render, then calculate total
  const total = useCart((state) => state.getTotal());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableId(table);
    }
  }, [searchParams, setTableId]);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  // Open cart when items are added
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };
    
    const handleCartUpdated = () => {
      // Auto-open cart when items are added (even if user closed it)
      if (items.length > 0) {
        setIsCartOpen(true);
      }
    };
    
    window.addEventListener('openCart', handleOpenCart);
    window.addEventListener('cartUpdated', handleCartUpdated);
    
    return () => {
      window.removeEventListener('openCart', handleOpenCart);
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-50 shadow-sm transition-all duration-300">
        {/* Subtle mosaic pattern - only on left side, not over cart sidebar */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-all duration-300"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            clipPath: isCartOpen 
              ? 'polygon(0% 0%, calc(100% - 384px) 0%, calc(100% - 384px) 100%, 0% 100%)'
              : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
          }}
        ></div>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-lg shadow-lg flex-shrink-0">
              <Coffee className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Karim's Coffee
              </h1>
              {tableId && (
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>Table {tableId}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300 ease-in-out flex-shrink-0 ml-4 ${
              isCartOpen 
                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500'
            } shadow-md hover:shadow-lg`}
          >
            {/* Icon with Badge */}
            <div className="relative flex-shrink-0">
              <ShoppingBag className={`h-6 w-6 transition-colors duration-300 ${
                isCartOpen ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-900 transition-all duration-300">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>
            
            {/* Text Content */}
            <div className="flex flex-col items-start justify-center min-w-0">
              <span className={`text-sm font-bold leading-none whitespace-nowrap transition-colors duration-300 ${
                isCartOpen ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Cart
              </span>
              {itemCount > 0 && (
                <span className={`text-xs font-semibold leading-none mt-0.5 whitespace-nowrap transition-colors duration-300 ${
                  isCartOpen ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {total.toFixed(2)} EGP
                </span>
              )}
            </div>
          </button>
        </div>
      </header>
      <div className="flex relative">
        <main className={`flex-1 w-full transition-all duration-300 ${isCartOpen ? 'lg:mr-96' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </div>
  );
}

