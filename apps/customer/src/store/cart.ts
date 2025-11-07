import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  menu_item_id: string;
  name: string;
  base_price: number;
  qty: number;
  options: Array<{ key: string; value: string; price_delta: number }>;
  note?: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  setTableId: (tableId: string | null) => void;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (menu_item_id: string, optionsKey: string) => void;
  updateQuantity: (menu_item_id: string, optionsKey: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getOptionsKey: (options: CartItem['options']) => string;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      setTableId: (tableId) => set({ tableId }),
      addItem: (item) => {
        const optionsKey = get().getOptionsKey(item.options);
        const existing = get().items.find(
          (i) => i.menu_item_id === item.menu_item_id && get().getOptionsKey(i.options) === optionsKey
        );
        if (existing) {
          get().updateQuantity(item.menu_item_id, optionsKey, existing.qty + 1);
        } else {
          set((state) => ({ items: [...state.items, { ...item, qty: 1 }] }));
        }
      },
      removeItem: (menu_item_id, optionsKey) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.menu_item_id === menu_item_id && get().getOptionsKey(i.options) === optionsKey)
          ),
        }));
      },
      updateQuantity: (menu_item_id, optionsKey, qty) => {
        if (qty <= 0) {
          get().removeItem(menu_item_id, optionsKey);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menu_item_id === menu_item_id && get().getOptionsKey(i.options) === optionsKey
              ? { ...i, qty }
              : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
          return total + itemTotal * item.qty;
        }, 0);
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

