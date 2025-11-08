// MongoDB API Client - default mode
import * as mongoApi from './mongo-client';
import * as demoApi from './demo';

// Export Database type
export type { Database } from './types';
export { getItemImage } from './item-images';
export { setupSyncListener, broadcastMessage, getSharedOrders, getSharedTickets, requestSync } from './cross-tab-sync';
export type { SyncMessage } from './cross-tab-sync';

// Check which mode to use
const useDemoMode = (import.meta as any).env?.VITE_USE_DEMO_MODE === 'true';
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

let supabase: any;

// Initialize based on mode
if (useDemoMode) {
  console.log('🍕 Running in DEMO MODE - Using localStorage');
  supabase = demoApi.supabase;
} else {
  console.log(`🍃 Running in MONGODB MODE - API: ${apiUrl}`);
  supabase = mongoApi.supabase;
}

// Export supabase for use in components
export { supabase };

// Export API functions based on mode
export const getStore = useDemoMode ? demoApi.getStore : mongoApi.getStore;
export const getMenuItems = useDemoMode ? demoApi.getMenuItems : mongoApi.getMenuItems;
export const getModifiers = useDemoMode ? demoApi.getModifiers : mongoApi.getModifiers;
export const getStations = useDemoMode ? demoApi.getStations : mongoApi.getStations;
export const createOrder = useDemoMode ? demoApi.createOrder : mongoApi.createOrder;
export const getOrders = useDemoMode ? demoApi.getOrders : mongoApi.getOrders;
export const getKdsTickets = useDemoMode ? demoApi.getKdsTickets : mongoApi.getKdsTickets;
export const updateKdsTicketStatus = useDemoMode ? demoApi.updateKdsTicketStatus : mongoApi.updateKdsTicketStatus;
export const updateOrderStatus = useDemoMode ? demoApi.updateOrderStatus : mongoApi.updateOrderStatus;
export const markOrderPaid = useDemoMode ? demoApi.markOrderPaid : mongoApi.markOrderPaid;
export const createCheckoutSession = useDemoMode ? demoApi.createCheckoutSession : mongoApi.createCheckoutSession;

// Export demo functions for direct use
export { markDemoOrderPaid } from './demo-store';

