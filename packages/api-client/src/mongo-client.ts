// MongoDB API Client - connects to the Express/MongoDB backend
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Socket.io connection for real-time updates
let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to MongoDB API server via Socket.io');
    });
    
    socket.on('disconnect', () => {
      console.log('⚠️ Disconnected from MongoDB API server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error.message);
    });
  }
  return socket;
}

// Mock supabase client for compatibility
export const supabase = {
  channel: (_channelName: string) => {
    const socket = getSocket();
    const listeners: any[] = [];
    
    return {
      on: (event: string, options: any, callback: (payload: any) => void) => {
        const eventMap: any = {
          'INSERT': 'created',
          'UPDATE': 'updated',
          'DELETE': 'deleted'
        };
        
        const table = options?.table;
        const socketEvent = `${table}:${eventMap[event] || event}`;
        
        const listener = (data: any) => {
          callback({
            new: data,
            old: {},
            eventType: event
          });
        };
        
        socket.on(socketEvent, listener);
        listeners.push({ event: socketEvent, listener });
        
        return {
          subscribe: () => {
            console.log(`📡 Subscribed to ${socketEvent}`);
            return { unsubscribe: () => {} };
          }
        };
      },
      subscribe: () => {
        return {
          unsubscribe: () => {
            listeners.forEach(({ event, listener }) => {
              socket.off(event, listener);
            });
          }
        };
      }
    };
  },
  removeChannel: () => {}
} as any;

// Helper function to make API requests
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// API Functions
export const getStore = async (storeId: string = '1') => {
  return await fetchAPI(`/api/stores/${storeId}`);
};

export const getMenuItems = async (storeId: string = '1') => {
  return await fetchAPI(`/api/menu-items?store_id=${storeId}`);
};

export const getModifiers = async (storeId: string = '1') => {
  return await fetchAPI(`/api/modifiers?store_id=${storeId}`);
};

export const getStations = async (storeId: string = '1') => {
  return await fetchAPI(`/api/stations?store_id=${storeId}`);
};

export const getTables = async (storeId: string = '1') => {
  return await fetchAPI(`/api/stores/${storeId}/tables`);
};

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
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  discount_percentage?: number;
  employee_id?: string;
  terminal_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  transaction_id?: string;
  receipt_number?: string;
  payment_method?: string;
  order_notes?: string;
  internal_notes?: string;
  location?: string;
  shift_id?: string;
}) => {
  return await fetchAPI('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getOrders = async (filters?: {
  store_id?: string;
  status?: string;
  channel?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.store_id) params.append('store_id', filters.store_id);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.channel) params.append('channel', filters.channel);
  
  const queryString = params.toString();
  return await fetchAPI(`/api/orders${queryString ? `?${queryString}` : ''}`);
};

export const getKdsTickets = async (filters?: {
  station_id?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.station_id) params.append('station_id', filters.station_id);
  if (filters?.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return await fetchAPI(`/api/kds-tickets${queryString ? `?${queryString}` : ''}`);
};

export const updateKdsTicketStatus = async (
  ticketId: string,
  status: 'new' | 'prep' | 'ready',
  bumpedBy?: string
) => {
  return await fetchAPI(`/api/kds-tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, bumped_by: bumpedBy }),
  });
};

export const updateOrderStatus = async (
  orderId: string,
  status: 'new' | 'paid' | 'in_prep' | 'ready' | 'served' | 'cancelled'
) => {
  return await fetchAPI(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
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
  return await fetchAPI('/api/payments', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      provider: paymentMethod,
      amount,
      ...paymentData,
    }),
  });
};

// Mock checkout session for demo
export const createCheckoutSession = async (orderId: string) => {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return {
    url: `${baseUrl}/#/payment/${orderId}`,
  };
};

