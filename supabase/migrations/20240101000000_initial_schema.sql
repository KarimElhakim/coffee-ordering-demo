-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores
CREATE TABLE stores (
  id TEXT PRIMARY KEY DEFAULT '1',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifiers
CREATE TABLE modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multi')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Modifiers (junction table)
CREATE TABLE item_modifiers (
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, modifier_id)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('table', 'kiosk', 'cashier', 'web')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'in_prep', 'ready', 'served', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  price_each DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Item Options (modifiers applied to order items)
CREATE TABLE order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  price_delta DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KDS Tickets
CREATE TABLE kds_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'prep', 'ready')),
  bumped_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'cash', 'card_present_demo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  amount DECIMAL(10, 2) NOT NULL,
  ext_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_kds_tickets_station_status ON kds_tickets(station_id, status);
CREATE INDEX idx_kds_tickets_status ON kds_tickets(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_menu_items_store ON menu_items(store_id);
CREATE INDEX idx_modifiers_store ON modifiers(store_id);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read access for stores, menu items, modifiers (for customer app)
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read modifiers" ON modifiers FOR SELECT USING (true);
CREATE POLICY "Public read stations" ON stations FOR SELECT USING (true);
CREATE POLICY "Public read tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Public read item_modifiers" ON item_modifiers FOR SELECT USING (true);

-- Public insert for orders (customers can create orders)
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_item_options" ON order_item_options FOR INSERT WITH CHECK (true);

-- Public read own orders (by table_id or order_id)
CREATE POLICY "Public read own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public read order_item_options" ON order_item_options FOR SELECT USING (true);

-- Staff can update orders and KDS tickets
CREATE POLICY "Staff update orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Staff update kds_tickets" ON kds_tickets FOR UPDATE USING (true);
CREATE POLICY "Staff read kds_tickets" ON kds_tickets FOR SELECT USING (true);
CREATE POLICY "Staff insert kds_tickets" ON kds_tickets FOR INSERT WITH CHECK (true);

-- Staff can read all orders
CREATE POLICY "Staff read orders" ON orders FOR SELECT USING (true);

-- Staff can insert payments
CREATE POLICY "Staff insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Staff update payments" ON payments FOR UPDATE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE kds_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

