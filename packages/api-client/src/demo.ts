// Demo mode API client - works without Supabase or Stripe
import { DEMO_DATA, getDemoOrders, getDemoKdsTickets, createDemoOrder, markDemoOrderPaid, updateDemoKdsTicket } from './demo-store';
import type { Database } from './types';

// Mock Supabase client
export const supabase = {
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
} as any;

// Demo API functions
export const getStore = async () => DEMO_DATA.store;

export const getMenuItems = async () => {
  return DEMO_DATA.menuItems.map((item) => ({
    ...item,
    station: DEMO_DATA.stations.find((s) => s.id === item.station_id),
    modifiers: DEMO_DATA.modifiers
      .filter((m) => {
        // Simple logic: all items can have size, espresso/cappuccino can have shots, etc.
        if (m.name === 'Size') return true;
        if (m.name === 'Milk' && (item.name.includes('Cappuccino') || item.name.includes('Latte'))) return true;
        if (m.name === 'Extra Shots' && (item.name.includes('Espresso') || item.name.includes('Cappuccino'))) return true;
        if (m.name === 'Syrups' && item.name.includes('Latte')) return true;
        return false;
      })
      .map((mod) => ({ modifier: mod })),
  }));
};

export const getModifiers = async () => DEMO_DATA.modifiers;

export const getStations = async () => DEMO_DATA.stations;

export const createOrder = async (orderData: {
  store_id: string;
  table_id?: string | null;
  channel: 'table' | 'kiosk' | 'cashier' | 'web';
  items: Array<{
    menu_item_id: string;
    qty: number;
    price_each: number;
    note?: string;
    options?: Array<{ key: string; value: string; price_delta: number }>;
  }>;
  total_amount: number;
}) => {
  return createDemoOrder(orderData);
};

export const getOrders = async (filters?: {
  store_id?: string;
  status?: string;
  channel?: string;
}) => {
  let orders = getDemoOrders();
  if (filters?.status) {
    orders = orders.filter((o: any) => o.status === filters.status);
  }
  if (filters?.channel) {
    orders = orders.filter((o: any) => o.channel === filters.channel);
  }
  return orders.sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const getKdsTickets = async (filters?: {
  station_id?: string;
  status?: string;
}) => {
  let tickets = getDemoKdsTickets();
  if (filters?.station_id) {
    tickets = tickets.filter((t: any) => t.station_id === filters.station_id);
  }
  if (filters?.status) {
    tickets = tickets.filter((t: any) => t.status === filters.status);
  }
  return tickets.sort((a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

export const updateKdsTicketStatus = async (
  ticketId: string,
  status: 'new' | 'prep' | 'ready',
  bumpedBy?: string
) => {
  return updateDemoKdsTicket(ticketId, status, bumpedBy);
};

export const markOrderPaid = async (
  orderId: string,
  paymentMethod: 'cash' | 'card_present_demo',
  amount: number
) => {
  return markDemoOrderPaid(orderId, paymentMethod, amount);
};

// Mock checkout session - returns a demo payment page URL
export const createCheckoutSession = async (orderId: string) => {
  // Return a URL that will open our demo payment page
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return {
    url: `${baseUrl}/#/payment/${orderId}`,
  };
};

