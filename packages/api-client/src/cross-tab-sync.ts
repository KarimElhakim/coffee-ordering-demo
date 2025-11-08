// Cross-tab synchronization for demo mode
// Allows different apps (different ports) to share data

const BROADCAST_CHANNEL_NAME = 'coffee-shop-demo';
let broadcastChannel: BroadcastChannel | null = null;

// Initialize broadcast channel
try {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
} catch (error) {
  console.warn('BroadcastChannel not supported, using fallback');
}

export interface SyncMessage {
  type: 'order-created' | 'ticket-created' | 'order-updated' | 'ticket-updated' | 'request-sync' | 'sync-data';
  payload: any;
}

// Send message to all tabs
export function broadcastMessage(message: SyncMessage) {
  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
    console.log('📡 Broadcast sent:', message.type);
  }
  
  // NOTE: Shared storage sync DISABLED to prevent duplicates
  // Each app now maintains its own local storage only
}

// Listen for messages from other tabs
export function setupSyncListener(callback: (message: SyncMessage) => void) {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      console.log('📡 Broadcast received:', event.data.type);
      callback(event.data);
    };
  }
  
  // NOTE: Storage event listener DISABLED to prevent duplicate order creation
  // Each app now manages its own localStorage independently
}

// Sync data to shared storage
function syncToSharedStorage(message: SyncMessage) {
  const timestamp = Date.now();
  
  switch (message.type) {
    case 'order-created':
    case 'order-updated':
      // Store orders in a shared key
      const orders = JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
      const existingIndex = orders.findIndex((o: any) => o.id === message.payload.id);
      if (existingIndex >= 0) {
        orders[existingIndex] = message.payload;
      } else {
        orders.push(message.payload);
      }
      localStorage.setItem('demo-orders-shared', JSON.stringify(orders));
      break;
      
    case 'ticket-created':
    case 'ticket-updated':
      // Store tickets in a shared key
      const tickets = JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');
      const ticketIndex = tickets.findIndex((t: any) => t.id === message.payload.id);
      if (ticketIndex >= 0) {
        tickets[ticketIndex] = message.payload;
      } else {
        tickets.push(message.payload);
      }
      localStorage.setItem('demo-kds-tickets-shared', JSON.stringify(tickets));
      break;
  }
  
  // Store message for storage event listener
  localStorage.setItem('demo-sync-message', JSON.stringify({ ...message, timestamp }));
}

// Get shared data
export function getSharedOrders() {
  return JSON.parse(localStorage.getItem('demo-orders-shared') || '[]');
}

export function getSharedTickets() {
  return JSON.parse(localStorage.getItem('demo-kds-tickets-shared') || '[]');
}

// Request sync from other tabs
export function requestSync() {
  broadcastMessage({
    type: 'request-sync',
    payload: { timestamp: Date.now() },
  });
}

