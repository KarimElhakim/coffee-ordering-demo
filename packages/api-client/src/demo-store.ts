// Demo store using localStorage - no API keys needed

// Seed data
const DEMO_STORE = {
  id: '1',
  name: 'Demo Coffee Shop',
};

const DEMO_TABLES = Array.from({ length: 10 }, (_, i) => ({
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
  {
    id: 'item-espresso',
    store_id: '1',
    name: 'Espresso',
    base_price: 25,
    station_id: 'station-bar',
    is_active: true,
  },
  {
    id: 'item-cappuccino',
    store_id: '1',
    name: 'Cappuccino',
    base_price: 35,
    station_id: 'station-bar',
    is_active: true,
  },
  {
    id: 'item-iced-latte',
    store_id: '1',
    name: 'Iced Latte',
    base_price: 40,
    station_id: 'station-cold',
    is_active: true,
  },
  {
    id: 'item-hot-chocolate',
    store_id: '1',
    name: 'Hot Chocolate',
    base_price: 30,
    station_id: 'station-hot',
    is_active: true,
  },
];

const DEMO_MODIFIERS = [
  { id: 'mod-size', store_id: '1', name: 'Size', type: 'single' as const },
  { id: 'mod-milk', store_id: '1', name: 'Milk', type: 'single' as const },
  { id: 'mod-shots', store_id: '1', name: 'Extra Shots', type: 'multi' as const },
  { id: 'mod-syrups', store_id: '1', name: 'Syrups', type: 'multi' as const },
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
  const orders = JSON.parse(localStorage.getItem('demo-orders') || '[]');
  return orders.map((order: any) => ({
    ...order,
    items: JSON.parse(localStorage.getItem(`demo-order-items-${order.id}`) || '[]'),
    payments: JSON.parse(localStorage.getItem(`demo-order-payments-${order.id}`) || '[]'),
  }));
}

export function getDemoKdsTickets() {
  return JSON.parse(localStorage.getItem('demo-kds-tickets') || '[]');
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
  }>;
  total_amount: number;
}) {
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const order = {
    id: orderId,
    store_id: orderData.store_id,
    table_id: orderData.table_id,
    channel: orderData.channel,
    status: 'new' as const,
    total_amount: orderData.total_amount,
    created_at: new Date().toISOString(),
  };

  const orders = getDemoOrders();
  orders.push(order);
  localStorage.setItem('demo-orders', JSON.stringify(orders));

  const orderItems = orderData.items.map((item, idx) => ({
    id: `item-${orderId}-${idx}`,
    order_id: orderId,
    menu_item_id: item.menu_item_id,
    qty: item.qty,
    price_each: item.price_each,
    note: item.note || null,
    menu_item: DEMO_MENU_ITEMS.find((m) => m.id === item.menu_item_id) || { name: 'Unknown' },
    options: item.options || [],
  }));

  localStorage.setItem(`demo-order-items-${orderId}`, JSON.stringify(orderItems));

  return order;
}

export function markDemoOrderPaid(orderId: string, paymentMethod: 'cash' | 'card_present_demo' | 'stripe', amount: number) {
  const orders = getDemoOrders();
  const order = orders.find((o: any) => o.id === orderId);
  if (!order) throw new Error('Order not found');

  order.status = 'paid';
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
  const tickets = orderItems.map((item: any) => {
    const menuItem = DEMO_MENU_ITEMS.find((m) => m.id === item.menu_item_id);
    if (!menuItem) return null;
    return {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_id: orderId,
      station_id: menuItem.station_id,
      status: 'new' as const,
      bumped_by: null,
      created_at: new Date().toISOString(),
      order: order,
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

