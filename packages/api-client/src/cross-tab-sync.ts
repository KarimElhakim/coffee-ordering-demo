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

// NOTE: syncToSharedStorage function removed - each app now manages its own localStorage
// independently to prevent duplicate order issues. Cross-tab sync is disabled.

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

