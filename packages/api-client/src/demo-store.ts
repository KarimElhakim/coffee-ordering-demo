// Demo store using localStorage - no API keys needed
import { broadcastMessage } from './cross-tab-sync';

// Seed data
const DEMO_STORE = {
  id: '1',
  name: 'Demo Coffee Shop',
};

const DEMO_TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `table-${i + 1}`,
  store_id: '1',
  label: `Table ${i + 1}`,
}));

const DEMO_STATIONS = [
  { id: 'station-bar', store_id: '1', name: 'Bar' },
  { id: 'station-hot', store_id: '1', name: 'Hot' },
  { id: 'station-cold', store_id: '1', name: 'Cold' },
];

const DEMO_MENU_ITEMS = [
  // Bar Station - Espresso Drinks
  {
    id: 'item-espresso',
    store_id: '1',
    name: 'Espresso',
    base_price: 25,
    station_id: 'station-bar',
    is_active: true,
    stock_quantity: 50,
    low_stock_threshold: 10,
    out_of_stock: false,
    track_inventory: true,
  },
  {
    id: 'item-cappuccino',
    store_id: '1',
    name: 'Cappuccino',
    base_price: 35,
    station_id: 'station-bar',
    is_active: true,
    stock_quantity: 45,
    low_stock_threshold: 10,
    out_of_stock: false,
    track_inventory: true,
  },
  {
    id: 'item-latte',
    store_id: '1',
    name: 'Caffè Latte',
    base_price: 40,
    station_id: 'station-bar',
    is_active: true,
    stock_quantity: 8,
    low_stock_threshold: 10,
    out_of_stock: false,
    track_inventory: true,
  },
  {
    id: 'item-americano',
    store_id: '1',
    name: 'Americano',
    base_price: 30,
    station_id: 'station-bar',
    is_active: true,
    stock_quantity: 40,
    low_stock_threshold: 10,
    out_of_stock: false,
    track_inventory: true,
  },
  {
    id: 'item-macchiato',
    store_id: '1',
    name: 'Macchiato',
    base_price: 32,
    station_id: 'station-bar',
    is_active: true,
  },
  {
    id: 'item-flat-white',
    store_id: '1',
    name: 'Flat White',
    base_price: 38,
    station_id: 'station-bar',
    is_active: true,
  },
  {
    id: 'item-mocha',
    store_id: '1',
    name: 'Mocha',
    base_price: 42,
    station_id: 'station-bar',
    is_active: true,
  },
  // Hot Station
  {
    id: 'item-hot-chocolate',
    store_id: '1',
    name: 'Hot Chocolate',
    base_price: 30,
    station_id: 'station-hot',
    is_active: true,
  },
  {
    id: 'item-chai-latte',
    store_id: '1',
    name: 'Chai Latte',
    base_price: 35,
    station_id: 'station-hot',
    is_active: true,
  },
  {
    id: 'item-matcha-latte',
    store_id: '1',
    name: 'Matcha Latte',
    base_price: 38,
    station_id: 'station-hot',
    is_active: true,
  },
  {
    id: 'item-turkish-coffee',
    store_id: '1',
    name: 'Turkish Coffee',
    base_price: 28,
    station_id: 'station-hot',
    is_active: true,
  },
  // Cold Station
  {
    id: 'item-iced-latte',
    store_id: '1',
    name: 'Iced Latte',
    base_price: 40,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-iced-americano',
    store_id: '1',
    name: 'Iced Americano',
    base_price: 32,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-cold-brew',
    store_id: '1',
    name: 'Cold Brew',
    base_price: 35,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-frappuccino',
    store_id: '1',
    name: 'Frappuccino',
    base_price: 45,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-iced-mocha',
    store_id: '1',
    name: 'Iced Mocha',
    base_price: 44,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-smoothie',
    store_id: '1',
    name: 'Fruit Smoothie',
    base_price: 40,
    station_id: 'station-cold',
    is_active: true,
  },
];

const DEMO_MODIFIERS = [
  { id: 'mod-size', store_id: '1', name: 'Size', type: 'single' as const },
  { id: 'mod-milk', store_id: '1', name: 'Milk', type: 'single' as const },
  { id: 'mod-shots', store_id: '1', name: 'Extra Shots', type: 'multi' as const },
  { id: 'mod-syrups', store_id: '1', name: 'Syrups', type: 'multi' as const },
  { id: 'mod-toppings', store_id: '1', name: 'Toppings', type: 'multi' as const },
];

// Initialize localStorage
function initStorage() {
  if (!localStorage.getItem('demo-orders')) {
    localStorage.setItem('demo-orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('demo-payments')) {
    localStorage.setItem('demo-payments', JSON.stringify([]));
  }
  if (!localStorage.getItem('demo-kds-tickets')) {
    localStorage.setItem('demo-kds-tickets', JSON.stringify([]));
  }
}

initStorage();

// Helper functions
export function getDemoOrders() {
  // Use local storage - but check shared key for cross-port access
  let orders = JSON.parse(localStorage.getItem('demo-orders') || '[]');
  
  // Also check shared storage (written by other ports via BroadcastChannel)
  try {
    const sharedOrders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
    if (sharedOrders.length > 0) {
      // Merge and deduplicate
      const allOrders = [...orders, ...sharedOrders];
      orders = allOrders.filter((order, index, self) =>
        index === self.findIndex((o: any) => o.id === order.id)
      );
      // Sync back to local
      localStorage.setItem('demo-orders', JSON.stringify(orders));
    }
  } catch (error) {
    console.warn('Could not read shared orders');
  }
  
  console.log('📦 getDemoOrders returning:', orders.length, 'orders');
  return orders.map((order: any) => ({
    ...order,
    items: JSON.parse(localStorage.getItem(`demo-order-items-${order.id}`) || '[]'),
    payments: JSON.parse(localStorage.getItem(`demo-order-payments-${order.id}`) || '[]'),
  }));
}

export function getDemoKdsTickets() {
  // Use local storage - but check shared key for cross-port access
  let tickets = JSON.parse(localStorage.getItem('demo-kds-tickets') || '[]');
  
  // Also check shared storage (written by other ports via BroadcastChannel)
  try {
    const sharedTickets = JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');
    if (sharedTickets.length > 0) {
      // Merge and deduplicate
      const allTickets = [...tickets, ...sharedTickets];
      tickets = allTickets.filter((ticket, index, self) =>
        index === self.findIndex((t: any) => t.id === ticket.id)
      );
      // Sync back to local
      localStorage.setItem('demo-kds-tickets', JSON.stringify(tickets));
    }
  } catch (error) {
    console.warn('Could not read shared tickets');
  }
  
  console.log('📦 getDemoKdsTickets returning:', tickets.length, 'tickets');
  return tickets;
}

export function createDemoOrder(orderData: {
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
}) {
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate sequential order number - check BOTH demo-orders and demo-orders-shared
  const storedOrders = JSON.parse(localStorage.getItem('demo-orders') || '[]');
  const sharedOrders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
  const allOrders = [...storedOrders, ...sharedOrders];
  
  const existingOrderNumbers = allOrders
    .map((o: any) => o.order_number)
    .filter((num: string) => num && num.match(/^ORD-\d+$/))
    .map((num: string) => parseInt(num.replace('ORD-', ''), 10))
    .filter((num: number) => !isNaN(num));
  
  const nextOrderNum = existingOrderNumbers.length > 0 
    ? Math.max(...existingOrderNumbers) + 1 
    : 1;
  const orderNumber = `ORD-${String(nextOrderNum).padStart(6, '0')}`;
  
  // Calculate financial breakdown if not provided
  const calculatedSubtotal = orderData.subtotal ?? orderData.items.reduce(
    (sum, item) => sum + (item.price_each * item.qty),
    0
  );
  const calculatedDiscountAmount = orderData.discount_amount ?? 
    (orderData.discount_percentage ? calculatedSubtotal * (orderData.discount_percentage / 100) : 0);
  const calculatedTaxAmount = orderData.tax_amount ?? calculatedSubtotal * 0.14; // 14% VAT
  
  // Generate receipt number if not provided
  const receiptNumber = orderData.receipt_number || `RCP-${Date.now()}`;
  
  const order = {
    id: orderId,
    order_number: orderNumber,
    store_id: orderData.store_id,
    table_id: orderData.table_id,
    channel: orderData.channel,
    status: 'new' as const,
    total_amount: orderData.total_amount,
    // Financial breakdown
    subtotal: calculatedSubtotal,
    tax_amount: calculatedTaxAmount,
    discount_amount: calculatedDiscountAmount,
    discount_percentage: orderData.discount_percentage ?? (calculatedDiscountAmount > 0 ? (calculatedDiscountAmount / calculatedSubtotal) * 100 : 0),
    // Operational fields
    employee_id: orderData.employee_id || null,
    terminal_id: orderData.terminal_id || null,
    customer_id: orderData.customer_id || null,
    customer_name: orderData.customer_name || null,
    customer_phone: orderData.customer_phone || null,
    customer_email: orderData.customer_email || null,
    // Transaction tracking
    transaction_id: orderData.transaction_id || null,
    receipt_number: receiptNumber,
    payment_method: orderData.payment_method || null,
    // Notes
    order_notes: orderData.order_notes || null,
    internal_notes: orderData.internal_notes || null,
    // Location
    location: orderData.location || (orderData.channel === 'table' ? 'dine-in' : orderData.channel === 'kiosk' ? 'takeout' : 'cashier'),
    shift_id: orderData.shift_id || null,
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storedOrders.push(order);
  localStorage.setItem('demo-orders', JSON.stringify(storedOrders));

  // Store order items with all details and timestamps
  const orderItems = orderData.items.map((item, idx) => {
    const menuItem = DEMO_MENU_ITEMS.find((m) => m.id === item.menu_item_id) || { name: 'Unknown' };
    const itemSubtotal = item.price_each * item.qty;
    const itemTaxAmount = itemSubtotal * 0.14; // 14% VAT per line item
    
    return {
      id: `item-${orderId}-${idx}`,
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      qty: item.qty,
      price_each: item.price_each,
      note: item.note || null,
      // Financial breakdown
      subtotal: itemSubtotal,
      discount_amount: 0, // Line item discounts can be added later
      tax_amount: itemTaxAmount,
      line_total: itemSubtotal + itemTaxAmount,
      // Product snapshot
      product_name: item.product_name || menuItem.name,
      product_sku: null,
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // For display purposes
      menu_item: menuItem,
      options: (item.options || []).map((opt, optIdx) => ({
        id: `opt-${orderId}-${idx}-${optIdx}`,
        order_item_id: `item-${orderId}-${idx}`,
        key: opt.key,
        value: opt.value,
        price_delta: opt.price_delta,
        created_at: new Date().toISOString(),
      })),
    };
  });

  localStorage.setItem(`demo-order-items-${orderId}`, JSON.stringify(orderItems));
  
  // Store order item options separately for better tracking
  const allOptions = orderItems.flatMap((item) => item.options || []);
  if (allOptions.length > 0) {
    localStorage.setItem(`demo-order-item-options-${orderId}`, JSON.stringify(allOptions));
  }

  // Create KDS tickets for each station immediately
  const existingTickets = JSON.parse(localStorage.getItem('demo-kds-tickets') || '[]');
  
  // Group items by station
  const itemsByStation = orderData.items.reduce((acc, item) => {
    const menuItem = DEMO_MENU_ITEMS.find(mi => mi.id === item.menu_item_id);
    if (menuItem) {
      const stationId = menuItem.station_id;
      if (!acc[stationId]) acc[stationId] = [];
      acc[stationId].push(item);
    }
    return acc;
  }, {} as Record<string, any[]>);
  
  // Create a ticket for each station that has items
  Object.keys(itemsByStation).forEach(stationId => {
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ticket = {
      id: ticketId,
      order_id: orderId,
      station_id: stationId,
      status: 'new' as const,
      bumped_by: null,
      created_at: new Date().toISOString(),
    };
    existingTickets.push(ticket);
    console.log('✅ Created KDS ticket:', ticketId, 'for station:', stationId, 'order:', orderId);
  });
  
  localStorage.setItem('demo-kds-tickets', JSON.stringify(existingTickets));
  console.log('✅ Total KDS tickets now:', existingTickets.length);
  
  // Save to shared storage for cross-port access
  try {
    // Save order to shared storage
    const sharedOrders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
    sharedOrders.push(order);
    localStorage.setItem('demo-orders-shared', JSON.stringify(sharedOrders));
    console.log('✅ Saved order to shared storage');
    
    // Save tickets to shared storage
    const sharedTickets = JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');
    Object.keys(itemsByStation).forEach(stationId => {
      const ticketForStation = existingTickets.find((t: any) => t.station_id === stationId && t.order_id === orderId);
      if (ticketForStation) {
        sharedTickets.push(ticketForStation);
        console.log('✅ Saved ticket to shared storage:', ticketForStation.id);
      }
    });
    localStorage.setItem('demo-kds-tickets-shared', JSON.stringify(sharedTickets));
    
    // Broadcast to other tabs
    broadcastMessage({
      type: 'order-created',
      payload: order,
    });
    console.log('📡 Broadcasted order-created event');
  } catch (error) {
    console.warn('⚠️ Cross-tab sync not available:', error);
  }

  return order;
}

export function markDemoOrderPaid(orderId: string, paymentMethod: 'cash' | 'card_present_demo' | 'stripe', amount: number) {
  const orders = getDemoOrders();
  const order = orders.find((o: any) => o.id === orderId);
  if (!order) throw new Error('Order not found');

  // Update order status and timestamp
  order.status = 'paid';
  order.updated_at = new Date().toISOString();
  localStorage.setItem('demo-orders', JSON.stringify(orders));

  // Create payment
  const payment = {
    id: `payment-${Date.now()}`,
    order_id: orderId,
    provider: paymentMethod,
    status: 'succeeded' as const,
    amount,
    ext_ref: `demo-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const payments = JSON.parse(localStorage.getItem(`demo-order-payments-${orderId}`) || '[]');
  payments.push(payment);
  localStorage.setItem(`demo-order-payments-${orderId}`, JSON.stringify(payments));

  // Create KDS tickets
  const orderItems = JSON.parse(localStorage.getItem(`demo-order-items-${orderId}`) || '[]');
  const tickets = orderItems.map((item: any, idx: number) => {
    const menuItem = DEMO_MENU_ITEMS.find((m) => m.id === item.menu_item_id);
    if (!menuItem) return null;
    return {
      id: `ticket-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      order_id: orderId,
      station_id: menuItem.station_id,
      status: 'new' as const,
      bumped_by: null,
      created_at: new Date().toISOString(),
      order: {
        ...order,
        items: orderItems,
      },
      station: DEMO_STATIONS.find((s) => s.id === menuItem.station_id),
    };
  }).filter(Boolean);

  const existingTickets = getDemoKdsTickets();
  existingTickets.push(...tickets);
  localStorage.setItem('demo-kds-tickets', JSON.stringify(existingTickets));

  return { order, payment };
}

export function updateDemoKdsTicket(ticketId: string, status: 'new' | 'prep' | 'ready', bumpedBy?: string) {
  const tickets = getDemoKdsTickets();
  const ticket = tickets.find((t: any) => t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');

  ticket.status = status;
  ticket.bumped_by = bumpedBy || null;
  localStorage.setItem('demo-kds-tickets', JSON.stringify(tickets));

  return ticket;
}

export const DEMO_DATA = {
  store: DEMO_STORE,
  tables: DEMO_TABLES,
  stations: DEMO_STATIONS,
  menuItems: DEMO_MENU_ITEMS,
  modifiers: DEMO_MODIFIERS,
};

