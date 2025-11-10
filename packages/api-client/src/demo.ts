// Demo mode API client - works without Supabase or Stripe
import { DEMO_DATA, getDemoOrders, getDemoKdsTickets, createDemoOrder, markDemoOrderPaid, updateDemoKdsTicket } from './demo-store';

// Mock Supabase client with proper chainable methods
const createMockChannel = () => {
  const mockChannel: any = {
    on: () => mockChannel, // Return self for chaining
    subscribe: () => mockChannel,
  };
  return mockChannel;
};

export const supabase = {
  channel: () => createMockChannel(),
  removeChannel: () => {},
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
} as any;

// Demo API functions
export const getStore = async () => DEMO_DATA.store;

export const getTables = async () => DEMO_DATA.tables;

export const getMenuItems = async () => {
  return DEMO_DATA.menuItems.map((item) => ({
    ...item,
    station: DEMO_DATA.stations.find((s) => s.id === item.station_id),
    modifiers: DEMO_DATA.modifiers
      .filter((m) => {
        // All items can have size
        if (m.name === 'Size') return true;
        // Milk for drinks that typically use milk
        if (m.name === 'Milk' && (
          item.name.includes('Cappuccino') || 
          item.name.includes('Latte') || 
          item.name.includes('Mocha') ||
          item.name.includes('Macchiato') ||
          item.name.includes('Flat White') ||
          item.name.includes('Chai') ||
          item.name.includes('Matcha')
        )) return true;
        // Extra shots for coffee drinks
        if (m.name === 'Extra Shots' && (
          item.name.includes('Espresso') || 
          item.name.includes('Cappuccino') ||
          item.name.includes('Latte') ||
          item.name.includes('Americano') ||
          item.name.includes('Macchiato') ||
          item.name.includes('Mocha')
        )) return true;
        // Syrups for most drinks
        if (m.name === 'Syrups' && !item.name.includes('Turkish')) return true;
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
    product_name?: string;
  }>;
  total_amount: number;
  // Financial breakdown
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  discount_percentage?: number;
  // Operational fields
  employee_id?: string;
  terminal_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  // Transaction tracking
  transaction_id?: string;
  receipt_number?: string;
  payment_method?: string;
  // Notes
  order_notes?: string;
  internal_notes?: string;
  // Location
  location?: string;
  shift_id?: string;
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
  const tickets = getDemoKdsTickets();
  const orders = getDemoOrders();
  
  console.log('🍳 KDS Demo: Raw tickets from storage:', tickets.length);
  console.log('🍳 KDS Demo: Orders available:', orders.length);
  
  // Enrich tickets with full order and station data
  let enrichedTickets = tickets.map((ticket: any) => {
    const order = orders.find((o: any) => o.id === ticket.order_id);
    const station = DEMO_DATA.stations.find((s) => s.id === ticket.station_id);
    
    if (!order) {
      console.warn('⚠️ Ticket missing order:', ticket.id, 'order_id:', ticket.order_id);
      return null;
    }
    
    // Get order items
    const orderItems = order.items || [];
    console.log('🍳 KDS Demo: Ticket', ticket.id, 'has', orderItems.length, 'items');
    
    return {
      ...ticket,
      order: {
        ...order,
        items: orderItems.map((item: any) => ({
          ...item,
          menu_item: DEMO_DATA.menuItems.find((mi) => mi.id === item.menu_item_id) || { name: 'Unknown' },
        })),
      },
      station: station || { id: ticket.station_id, name: 'Unknown', store_id: '1', created_at: new Date().toISOString() },
    };
  }).filter((t: any) => t !== null);
  
  // Apply filters
  if (filters?.station_id) {
    enrichedTickets = enrichedTickets.filter((t: any) => t.station_id === filters.station_id);
  }
  if (filters?.status) {
    enrichedTickets = enrichedTickets.filter((t: any) => t.status === filters.status);
  }
  
  console.log('🍳 KDS Demo: Returning', enrichedTickets.length, 'enriched tickets');
  
  return enrichedTickets.sort((a: any, b: any) => 
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

export const updateOrderStatus = async (
  orderId: string,
  status: 'new' | 'paid' | 'in_prep' | 'ready' | 'served' | 'cancelled'
) => {
  const orders = JSON.parse(localStorage.getItem('demo-orders') || '[]');
  const updatedOrders = orders.map((o: any) =>
    o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
  );
  localStorage.setItem('demo-orders', JSON.stringify(updatedOrders));
  const order = updatedOrders.find((o: any) => o.id === orderId);
  return order;
};

export const markOrderPaid = async (
  orderId: string,
  paymentMethod: 'cash' | 'card_present_demo',
  amount: number,
  paymentData?: {
    payment_method?: string;
    order_type?: 'dine-in' | 'takeaway';
    table_id?: string | null;
  }
) => {
  return markDemoOrderPaid(orderId, paymentMethod, amount, paymentData);
};

// Mock checkout session - returns a demo payment page URL
export const createCheckoutSession = async (orderId: string) => {
  // Return a URL that will open our demo payment page
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return {
    url: `${baseUrl}/#/payment/${orderId}`,
  };
};

