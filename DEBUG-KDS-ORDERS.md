# 🐛 Debugging KDS Orders Not Appearing

## Issue
Orders created from Customer/POS apps don't show up in KDS Order Queue.

## Root Cause Analysis

The issue is likely one of the following:

### 1. **Tickets Not Being Created**
When an order is created, KDS tickets should be automatically generated.

**Check localStorage:**
```javascript
// In browser console (any app):
JSON.parse(localStorage.getItem('demo-kds-tickets') || '[]')
// Should show array of tickets
```

### 2. **Tickets Missing Order Data**
Tickets exist but aren't properly linked to orders.

**Check orders:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('demo-orders') || '[]')
// Should show array of orders with matching IDs
```

### 3. **Tickets Missing Items**
Order items aren't being loaded.

**Check order items:**
```javascript
// Replace ORDER_ID with actual order ID
JSON.parse(localStorage.getItem('demo-order-items-ORDER_ID') || '[]')
// Should show array of items
```

## Fix Applied

### Updated `createDemoOrder()` in `demo-store.ts`:
```typescript
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
```

### Updated `getKdsTickets()` in `demo.ts`:
```typescript
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
```

## Testing Steps

### Step 1: Clear Old Data
```javascript
// In browser console (F12):
localStorage.clear();
location.reload();
```

### Step 2: Create Test Order
1. Open POS: http://localhost:5174
2. Add item (Espresso)
3. Click Cash
4. Enter phone: 01234567890
5. Click Continue
6. Wait for success message

### Step 3: Check Console Logs
**In POS console, you should see:**
```
✅ Created KDS ticket: ticket-xxx for station: station-bar order: order-xxx
✅ Total KDS tickets now: 1
```

**In KDS console (after refresh), you should see:**
```
🍳 KDS Demo: Raw tickets from storage: 1
🍳 KDS Demo: Orders available: 1
🍳 KDS Demo: Ticket ticket-xxx has 1 items
🍳 KDS Demo: Returning 1 enriched tickets
🍳 KDS: Loaded 1 tickets
```

### Step 4: Verify in KDS
1. Open KDS: http://localhost:5175
2. Click "Order Queue" tab
3. Order should appear in "New" column within 3 seconds

## Expected Behavior

✅ **Ticket Creation**: Happens immediately when order is placed  
✅ **Data Structure**: Each ticket links to order, station, and items  
✅ **Real-time**: KDS polls every 3 seconds for new tickets  
✅ **Display**: Shows order number, items, modifiers, customer info  

## If Still Not Working

1. **Check localStorage keys:**
   - `demo-orders` - should have orders
   - `demo-kds-tickets` - should have tickets  
   - `demo-order-items-{orderId}` - should have items per order

2. **Verify ticket order_id matches existing order ID**

3. **Check console for errors** - especially in KDS app

4. **Try refreshing KDS** after creating an order (F5)

