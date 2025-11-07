import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from './cart';
import type { CartItem } from './cart';

describe('Cart Store', () => {
  beforeEach(() => {
    // Clear cart before each test
    useCart.getState().clearCart();
    // Clear localStorage
    localStorage.clear();
  });

  describe('addItem', () => {
    it('should add a new item to empty cart', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      useCart.getState().addItem(item);

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        qty: 1,
        options: [],
      });
    });

    it('should increment quantity when adding same item with same options', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      useCart.getState().addItem(item);
      useCart.getState().addItem(item);

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].qty).toBe(2);
    });

    it('should add as separate item when options differ', () => {
      const item1: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [{ key: 'Size', value: 'Small', price_delta: 0 }],
      };

      const item2: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [{ key: 'Size', value: 'Large', price_delta: 5 }],
      };

      useCart.getState().addItem(item1);
      useCart.getState().addItem(item2);

      const state = useCart.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].options[0].value).toBe('Small');
      expect(state.items[1].options[0].value).toBe('Large');
    });

    it('should handle items with multiple options correctly', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Cappuccino',
        base_price: 30,
        options: [
          { key: 'Size', value: 'Large', price_delta: 5 },
          { key: 'Milk', value: 'Oat', price_delta: 3 },
        ],
      };

      useCart.getState().addItem(item);

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].options).toHaveLength(2);
    });

    it('should dispatch cartUpdated event after adding item', async () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      return new Promise<void>((resolve, reject) => {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          try {
            expect(customEvent.detail.items).toHaveLength(1);
            window.removeEventListener('cartUpdated', handler);
            resolve();
          } catch (error) {
            window.removeEventListener('cartUpdated', handler);
            reject(error);
          }
        };

        window.addEventListener('cartUpdated', handler);
        useCart.getState().addItem(item);

        // Timeout after 200ms
        setTimeout(() => {
          window.removeEventListener('cartUpdated', handler);
          reject(new Error('cartUpdated event was not dispatched within timeout'));
        }, 200);
      });
    });

    it('should calculate correct total with options', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Cappuccino',
        base_price: 30,
        options: [
          { key: 'Size', value: 'Large', price_delta: 5 },
          { key: 'Milk', value: 'Oat', price_delta: 3 },
        ],
      };

      useCart.getState().addItem(item);
      useCart.getState().addItem(item); // Add twice

      const total = useCart.getState().getTotal();
      // Base: 30, Size: 5, Milk: 3 = 38 per item
      // 2 items = 76
      expect(total).toBe(76);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      useCart.getState().addItem(item);
      const optionsKey = useCart.getState().getOptionsKey([]);
      useCart.getState().removeItem('item-1', optionsKey);

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should only remove item with matching options', () => {
      const item1: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [{ key: 'Size', value: 'Small', price_delta: 0 }],
      };

      const item2: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [{ key: 'Size', value: 'Large', price_delta: 5 }],
      };

      useCart.getState().addItem(item1);
      useCart.getState().addItem(item2);

      const optionsKey1 = useCart.getState().getOptionsKey(item1.options);
      useCart.getState().removeItem('item-1', optionsKey1);

      const state = useCart.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].options[0].value).toBe('Large');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      useCart.getState().addItem(item);
      const optionsKey = useCart.getState().getOptionsKey([]);
      useCart.getState().updateQuantity('item-1', optionsKey, 5);

      const state = useCart.getState();
      expect(state.items[0].qty).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      const item: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      useCart.getState().addItem(item);
      const optionsKey = useCart.getState().getOptionsKey([]);
      useCart.getState().updateQuantity('item-1', optionsKey, 0);

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('getTotal', () => {
    it('should return 0 for empty cart', () => {
      const total = useCart.getState().getTotal();
      expect(total).toBe(0);
    });

    it('should calculate total correctly for multiple items', () => {
      const item1: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      const item2: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-2',
        name: 'Cappuccino',
        base_price: 30,
        options: [{ key: 'Size', value: 'Large', price_delta: 5 }],
      };

      useCart.getState().addItem(item1);
      useCart.getState().addItem(item1); // Add twice
      useCart.getState().addItem(item2);

      const total = useCart.getState().getTotal();
      // Item1: 25 * 2 = 50
      // Item2: (30 + 5) * 1 = 35
      // Total: 85
      expect(total).toBe(85);
    });
  });

  describe('getOptionsKey', () => {
    it('should generate consistent key for same options', () => {
      const options1 = [
        { key: 'Size', value: 'Large', price_delta: 5 },
        { key: 'Milk', value: 'Oat', price_delta: 3 },
      ];

      const options2 = [
        { key: 'Milk', value: 'Oat', price_delta: 3 },
        { key: 'Size', value: 'Large', price_delta: 5 },
      ];

      const key1 = useCart.getState().getOptionsKey(options1);
      const key2 = useCart.getState().getOptionsKey(options2);

      // Should be same regardless of order
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different options', () => {
      const options1 = [{ key: 'Size', value: 'Small', price_delta: 0 }];
      const options2 = [{ key: 'Size', value: 'Large', price_delta: 5 }];

      const key1 = useCart.getState().getOptionsKey(options1);
      const key2 = useCart.getState().getOptionsKey(options2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const item1: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-1',
        name: 'Espresso',
        base_price: 25,
        options: [],
      };

      const item2: Omit<CartItem, 'qty'> = {
        menu_item_id: 'item-2',
        name: 'Cappuccino',
        base_price: 30,
        options: [],
      };

      useCart.getState().addItem(item1);
      useCart.getState().addItem(item2);
      useCart.getState().clearCart();

      const state = useCart.getState();
      expect(state.items).toHaveLength(0);
      expect(useCart.getState().getTotal()).toBe(0);
    });
  });
});

