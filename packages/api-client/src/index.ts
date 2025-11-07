import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper functions
export const getStore = async (storeId: string = '1') => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();
  if (error) throw error;
  return data;
};

export const getMenuItems = async (storeId: string = '1') => {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      station:stations(*),
      modifiers:item_modifiers(
        modifier:modifiers(*)
      )
    `)
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
};

export const getModifiers = async (storeId: string = '1') => {
  const { data, error } = await supabase
    .from('modifiers')
    .select('*')
    .eq('store_id', storeId)
    .order('name');
  if (error) throw error;
  return data;
};

export const getStations = async (storeId: string = '1') => {
  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('store_id', storeId)
    .order('name');
  if (error) throw error;
  return data;
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
  }>;
  total_amount: number;
}) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: orderData.store_id,
      table_id: orderData.table_id,
      channel: orderData.channel,
      status: 'new',
      total_amount: orderData.total_amount,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = orderData.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    qty: item.qty,
    price_each: item.price_each,
    note: item.note || null,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) throw itemsError;

  // Insert options
  const options = orderData.items.flatMap((item, idx) =>
    (item.options || []).map((opt) => ({
      order_item_id: items[idx].id,
      key: opt.key,
      value: opt.value,
      price_delta: opt.price_delta,
    }))
  );

  if (options.length > 0) {
    const { error: optionsError } = await supabase
      .from('order_item_options')
      .insert(options);
    if (optionsError) throw optionsError;
  }

  return order;
};

export const getOrders = async (filters?: {
  store_id?: string;
  status?: string;
  channel?: string;
}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      table:tables(label),
      items:order_items(
        *,
        menu_item:menu_items(name, base_price)
      ),
      payments(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.store_id) {
    query = query.eq('store_id', filters.store_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getKdsTickets = async (filters?: {
  station_id?: string;
  status?: string;
}) => {
  let query = supabase
    .from('kds_tickets')
    .select(`
      *,
      order:orders(
        *,
        items:order_items(
          *,
          menu_item:menu_items(name),
          options:order_item_options(*)
        )
      ),
      station:stations(*)
    `)
    .order('created_at', { ascending: true });

  if (filters?.station_id) {
    query = query.eq('station_id', filters.station_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateKdsTicketStatus = async (
  ticketId: string,
  status: 'new' | 'prep' | 'ready',
  bumpedBy?: string
) => {
  const { data, error } = await supabase
    .from('kds_tickets')
    .update({ status, bumped_by: bumpedBy || null })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const markOrderPaid = async (
  orderId: string,
  paymentMethod: 'cash' | 'card_present_demo',
  amount: number
) => {
  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      provider: paymentMethod,
      status: 'succeeded',
      amount,
      ext_ref: `demo_${Date.now()}`,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) throw orderError;

  // Create KDS tickets
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_item:menu_items(station_id)
    `)
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  const tickets = items
    .filter((item) => item.menu_item?.station_id)
    .map((item) => ({
      order_id: orderId,
      station_id: item.menu_item.station_id,
      status: 'new' as const,
    }));

  if (tickets.length > 0) {
    const { error: ticketsError } = await supabase
      .from('kds_tickets')
      .insert(tickets);
    if (ticketsError) throw ticketsError;
  }

  return { order, payment };
};

export const createCheckoutSession = async (orderId: string) => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { order_id: orderId },
  });
  if (error) throw error;
  return data;
};

