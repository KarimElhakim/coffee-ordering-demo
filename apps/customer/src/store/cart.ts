import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  menu_item_id: string;
  name: string;
  base_price: number;
  qty: number;
  options: Array<{ key: string; value: string; price_delta: number }>;
  note?: string;
  // Image data for proper display
  image_url?: string;
  local_image_path?: string;
  category?: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  gameDiscount: number;
  setTableId: (tableId: string | null) => void;
  setGameDiscount: (discount: number) => void;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (menu_item_id: string, optionsKey: string) => void;
  updateQuantity: (menu_item_id: string, optionsKey: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getDiscountedTotal: () => { subtotal: number; discount: number; total: number };
  getOptionsKey: (options: CartItem['options']) => string;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      gameDiscount: 0,
      setTableId: (tableId) => set({ tableId }),
      setGameDiscount: (discount) => set({ gameDiscount: discount }),
      addItem: (item) => {
        try {
          const optionsKey = get().getOptionsKey(item.options || []);
          const currentItems = [...get().items];
          
          const existingIndex = currentItems.findIndex(
            (i) => i.menu_item_id === item.menu_item_id && get().getOptionsKey(i.options || []) === optionsKey
          );
          
          let updatedItems: CartItem[];
          
          if (existingIndex >= 0) {
            // Update existing item quantity
            updatedItems = currentItems.map((i, idx) => 
              idx === existingIndex ? { ...i, qty: i.qty + 1 } : i
            );
          } else {
            // Add new item
            const newItem = { ...item, qty: 1 };
            updatedItems = [...currentItems, newItem];
          }
          
          // Set state immediately
          set({ items: updatedItems });
          
          // Dispatch event for components to update
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: updatedItems } }));
        } catch (error) {
          console.error('Error adding item to cart:', error);
          throw error;
        }
      },
      removeItem: (menu_item_id, optionsKey) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.menu_item_id === menu_item_id && get().getOptionsKey(i.options) === optionsKey)
          );
          console.log('Item removed, new items:', newItems);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: newItems } }));
          }, 0);
          return { items: newItems };
        });
      },
      updateQuantity: (menu_item_id, optionsKey, qty) => {
        if (qty <= 0) {
          get().removeItem(menu_item_id, optionsKey);
          return;
        }
        set((state) => {
          const newItems = state.items.map((i) =>
            i.menu_item_id === menu_item_id && get().getOptionsKey(i.options) === optionsKey
              ? { ...i, qty }
              : i
          );
          console.log('Quantity updated, new items:', newItems);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: newItems } }));
          }, 0);
          return { items: newItems };
        });
      },
      clearCart: () => set({ items: [], gameDiscount: 0 }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
          return total + itemTotal * item.qty;
        }, 0);
      },
      getDiscountedTotal: () => {
        const items = get().items;
        const discount = get().gameDiscount;
        const subtotal = get().getTotal();
        
        if (discount > 0 && items.length > 0) {
          // Find lowest priced item
          const lowestPriceItem = items.reduce((lowest, item) => {
            const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
            const lowestPrice = lowest.base_price + lowest.options.reduce((sum, opt) => sum + opt.price_delta, 0);
            return itemPrice < lowestPrice ? item : lowest;
          });
          
          const lowestPrice = lowestPriceItem.base_price + lowestPriceItem.options.reduce((sum, opt) => sum + opt.price_delta, 0);
          const discountAmount = lowestPrice * lowestPriceItem.qty * discount;
          
          return {
            subtotal,
            discount: discountAmount,
            total: subtotal - discountAmount,
          };
        }
        
        return { subtotal, discount: 0, total: subtotal };
      },
      getOptionsKey: (options) => {
        return JSON.stringify(options.sort((a, b) => a.key.localeCompare(b.key)));
      },
    }),
    {
      name: 'customer-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

