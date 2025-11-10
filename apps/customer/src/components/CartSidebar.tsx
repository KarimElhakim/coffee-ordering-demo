import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { getItemImage } from '@coffee-demo/api-client';
import { Button } from '@coffee-demo/ui';
import { ShoppingCart, Plus, Minus, Trash2, X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  // Subscribe to cart state - Zustand will trigger re-render when items change
  const items = useCart((state) => state.items);
  const removeItem = useCart((state) => state.removeItem);
  const updateQuantity = useCart((state) => state.updateQuantity);
  // Subscribe to items to trigger re-render, then calculate total
  const subtotal = useCart((state) => state.getTotal());
  const getOptionsKey = useCart((state) => state.getOptionsKey);
  
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());

  const vat = subtotal * 0.14; // 14% VAT
  const total = subtotal + vat;

  // Highlight newly added items
  useEffect(() => {
    if (items.length > 0) {
      // Get the last item added (assuming it's the newest)
      const lastItem = items[items.length - 1];
      const optionsKey = getOptionsKey(lastItem.options || []);
      const itemKey = `${lastItem.menu_item_id}-${optionsKey}`;
      
      // Add to highlighted set
      setHighlightedItems((prev: Set<string>) => new Set([...prev, itemKey]));
      
      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedItems((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [items.length, getOptionsKey]);

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  const handleRemove = (menuItemId: string, optionsKey: string) => {
    setIsAnimating(true);
    removeItem(menuItemId, optionsKey);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleQuantityChange = (menuItemId: string, optionsKey: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemove(menuItemId, optionsKey);
    } else {
      updateQuantity(menuItemId, optionsKey, newQty);
    }
  };

  // Show sidebar if it's open (cart button clicked) OR if there are items (auto-open on add)
  // But allow closing even when there are items
  const shouldShow = isOpen;
  
  return (
    <>
      {/* Backdrop */}
      {shouldShow && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed right-0 top-[73px] bottom-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
        shouldShow ? 'translate-x-0' : 'translate-x-full'
      } border-l-[3px] border-t-[3px] border-gray-200 dark:border-gray-700 rounded-tl-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-[3px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white dark:text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Cart</h2>
              {items.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {items.reduce((sum, item) => sum + item.qty, 0)} item{items.reduce((sum, item) => sum + item.qty, 0) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add some delicious items to get started!</p>
            </div>
          ) : (
            items.map((item) => {
              const itemPrice = item.base_price + (item.options || []).reduce((sum: number, opt: any) => sum + opt.price_delta, 0);
              const itemTotal = itemPrice * item.qty;
              const optionsKey = getOptionsKey(item.options || []);
              const itemKey = `${item.menu_item_id}-${optionsKey}`;
              const isHighlighted = highlightedItems.has(itemKey);
              
              return (
                <div
                  key={itemKey}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-[3px] shadow-sm hover:shadow-md transition-all ${
                    isHighlighted 
                      ? 'border-gray-900 dark:border-white ring-2 ring-gray-900 dark:ring-white ring-offset-2' 
                      : 'border-gray-200 dark:border-gray-700'
                  } ${
                    isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border-2 border-gray-900 dark:border-white">
                      <img
                        src={getItemImage(item.name, item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/000000/ffffff?text=' + encodeURIComponent(item.name.substring(0, 2));
                        }}
                      />
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                          {item.options && item.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.options.map((opt: any) => (
                                <span
                                  key={`${opt.key}-${opt.value}`}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium"
                                >
                                  {opt.key}: {opt.value}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.note && (
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 italic truncate">
                              {item.note}
                            </p>
                          )}
                        </div>
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.menu_item_id, optionsKey)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                      
                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.menu_item_id, optionsKey, item.qty - 1)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                          </button>
                          <span className="px-2.5 py-1 text-xs font-bold text-gray-900 dark:text-white min-w-[1.5rem] text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.menu_item_id, optionsKey, item.qty + 1)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {itemTotal.toFixed(2)} EGP
                          </p>
                          {item.qty > 1 && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {itemPrice.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Totals and Checkout */}
        {items.length > 0 && (
          <div className="border-t-[3px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4 sticky bottom-0 rounded-bl-2xl">
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{subtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">VAT (14%)</span>
                <span className="font-semibold text-gray-900 dark:text-white">{vat.toFixed(2)} EGP</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {total.toFixed(2)} EGP
                </span>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-3 shadow-lg rounded-lg transition-all hover:shadow-xl"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

