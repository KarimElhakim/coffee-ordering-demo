// Paste this in browser console (F12) to debug KDS issues

console.log('%c========================================', 'color: cyan; font-weight: bold');
console.log('%c🔍 KDS DATA DEBUG REPORT', 'color: lime; font-weight: bold; font-size: 16px');
console.log('%c========================================', 'color: cyan; font-weight: bold');

// Check local storage
const localOrders = JSON.parse(localStorage.getItem('demo-orders') || '[]');
const localTickets = JSON.parse(localStorage.getItem('demo-kds-tickets') || '[]');
const sharedOrders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
const sharedTickets = JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');

console.log('\n📦 LOCAL STORAGE (this port only):');
console.log(`  Orders: ${localOrders.length}`);
console.log(`  Tickets: ${localTickets.length}`);

console.log('\n🌐 SHARED STORAGE (all ports):');
console.log(`  Orders: ${sharedOrders.length}`);
console.log(`  Tickets: ${sharedTickets.length}`);

console.log('\n📊 DETAILED DATA:');

if (localOrders.length > 0) {
  console.log('\n  Local Orders:');
  localOrders.forEach((order, i) => {
    console.log(`    ${i + 1}. ${order.order_number || order.id.slice(0, 8)} - ${order.status}`);
  });
}

if (sharedOrders.length > 0) {
  console.log('\n  Shared Orders:');
  sharedOrders.forEach((order, i) => {
    console.log(`    ${i + 1}. ${order.order_number || order.id.slice(0, 8)} - ${order.status}`);
  });
}

if (localTickets.length > 0) {
  console.log('\n  Local Tickets:');
  localTickets.forEach((ticket, i) => {
    console.log(`    ${i + 1}. ${ticket.id.slice(0, 15)}... → Order: ${ticket.order_id.slice(0, 15)}... Station: ${ticket.station_id}`);
  });
}

if (sharedTickets.length > 0) {
  console.log('\n  Shared Tickets:');
  sharedTickets.forEach((ticket, i) => {
    console.log(`    ${i + 1}. ${ticket.id.slice(0, 15)}... → Order: ${ticket.order_id.slice(0, 15)}... Station: ${ticket.station_id}`);
  });
}

// Check order items
console.log('\n📋 ORDER ITEMS:');
const allOrderIds = [...new Set([...localOrders.map(o => o.id), ...sharedOrders.map(o => o.id)])];
allOrderIds.forEach(orderId => {
  const items = JSON.parse(localStorage.getItem(`demo-order-items-${orderId}`) || '[]');
  if (items.length > 0) {
    console.log(`  Order ${orderId.slice(0, 15)}... has ${items.length} items`);
  }
});

console.log('\n%c========================================', 'color: cyan; font-weight: bold');
console.log('%cRUN THIS IN BOTH POS AND KDS TO COMPARE!', 'color: yellow; font-weight: bold');
console.log('%c========================================', 'color: cyan; font-weight: bold\n');

// Helper function to create test order
window.createTestKDSOrder = function() {
  const orderId = `order-debug-${Date.now()}`;
  const orderNumber = `ORD-DEBUG-${String(Date.now()).slice(-3)}`;
  
  const order = {
    id: orderId,
    order_number: orderNumber,
    store_id: '1',
    status: 'new',
    total_amount: 50,
    customer_name: 'Debug Order',
    customer_phone: '0123456789',
    location: 'debug',
    created_at: new Date().toISOString(),
  };
  
  const items = [{
    id: `item-${orderId}-0`,
    order_id: orderId,
    menu_item_id: 'item-espresso',
    qty: 1,
    price_each: 25,
    menu_item: { name: 'Espresso' },
    options: []
  }];
  
  const ticket = {
    id: `ticket-debug-${Date.now()}`,
    order_id: orderId,
    station_id: 'station-bar',
    status: 'new',
    created_at: new Date().toISOString(),
  };
  
  // Save to SHARED storage
  const sharedOrders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
  sharedOrders.push(order);
  localStorage.setItem('demo-orders-shared', JSON.stringify(sharedOrders));
  
  const sharedTickets = JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');
  sharedTickets.push(ticket);
  localStorage.setItem('demo-kds-tickets-shared', JSON.stringify(sharedTickets));
  
  localStorage.setItem(`demo-order-items-${orderId}`, JSON.stringify(items));
  
  console.log('%c✅ DEBUG ORDER CREATED!', 'color: lime; font-weight: bold; font-size: 14px');
  console.log('Order Number:', orderNumber);
  console.log('Order ID:', orderId);
  console.log('Ticket ID:', ticket.id);
  console.log('\n%cNow refresh KDS and check if it appears!', 'color: yellow');
  
  return { order, ticket };
};

console.log('%c💡 TIP: Run createTestKDSOrder() to create a test order', 'color: cyan');

