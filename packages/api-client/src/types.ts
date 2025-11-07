export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          store_id: string;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          label: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          label?: string;
          created_at?: string;
        };
      };
      stations: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          base_price: number;
          station_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          base_price: number;
          station_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          base_price?: number;
          station_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      modifiers: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          type: 'single' | 'multi';
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          type: 'single' | 'multi';
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          type?: 'single' | 'multi';
          created_at?: string;
        };
      };
      item_modifiers: {
        Row: {
          item_id: string;
          modifier_id: string;
        };
        Insert: {
          item_id: string;
          modifier_id: string;
        };
        Update: {
          item_id?: string;
          modifier_id?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          table_id: string | null;
          channel: 'table' | 'kiosk' | 'cashier' | 'web';
          status: 'new' | 'paid' | 'in_prep' | 'ready' | 'served' | 'cancelled';
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          table_id?: string | null;
          channel: 'table' | 'kiosk' | 'cashier' | 'web';
          status?: 'new' | 'paid' | 'in_prep' | 'ready' | 'served' | 'cancelled';
          total_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          table_id?: string | null;
          channel?: 'table' | 'kiosk' | 'cashier' | 'web';
          status?: 'new' | 'paid' | 'in_prep' | 'ready' | 'served' | 'cancelled';
          total_amount?: number;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          qty: number;
          price_each: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          qty: number;
          price_each: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          qty?: number;
          price_each?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      order_item_options: {
        Row: {
          id: string;
          order_item_id: string;
          key: string;
          value: string;
          price_delta: number;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          key: string;
          value: string;
          price_delta: number;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          key?: string;
          value?: string;
          price_delta?: number;
        };
      };
      kds_tickets: {
        Row: {
          id: string;
          order_id: string;
          station_id: string;
          status: 'new' | 'prep' | 'ready';
          bumped_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          station_id: string;
          status?: 'new' | 'prep' | 'ready';
          bumped_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          station_id?: string;
          status?: 'new' | 'prep' | 'ready';
          bumped_by?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: 'stripe' | 'cash' | 'card_present_demo';
          status: 'pending' | 'succeeded' | 'failed';
          amount: number;
          ext_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: 'stripe' | 'cash' | 'card_present_demo';
          status?: 'pending' | 'succeeded' | 'failed';
          amount: number;
          ext_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: 'stripe' | 'cash' | 'card_present_demo';
          status?: 'pending' | 'succeeded' | 'failed';
          amount?: number;
          ext_ref?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

