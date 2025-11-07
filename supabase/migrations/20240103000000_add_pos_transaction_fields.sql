-- Add comprehensive POS transaction fields to match industry standards

-- ============================================
-- ORDERS TABLE ENHANCEMENTS
-- ============================================

-- Add financial breakdown fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;

-- Add operational fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS employee_id TEXT; -- Cashier/employee who processed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terminal_id TEXT; -- POS terminal/register identifier
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT; -- Customer reference (optional)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT; -- Walk-in customer name
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT; -- Customer contact
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT; -- Customer email

-- Add transaction tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id TEXT; -- External transaction reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_number TEXT; -- Receipt number
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT; -- Payment method used

-- Add notes and metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_notes TEXT; -- General order notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT; -- Staff-only notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT; -- Why order was cancelled

-- Add timestamps for lifecycle tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ; -- When payment was completed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ; -- When order was completed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ; -- When order was cancelled
ALTER TABLE orders ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ; -- When order was served

-- Add location/context fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shift_id TEXT; -- Which shift this order belongs to
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location TEXT; -- Physical location (dine-in, takeout, delivery)

-- ============================================
-- ORDER ITEMS TABLE ENHANCEMENTS
-- ============================================

-- Add financial breakdown for line items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2); -- qty * price_each
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(10, 2); -- Final line total after discounts/tax

-- Add product snapshot (for historical accuracy)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT; -- Snapshot of product name at time of sale
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku TEXT; -- Product SKU if applicable

-- Add timestamps
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- PAYMENTS TABLE ENHANCEMENTS
-- ============================================

-- Add payment details
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS change_amount DECIMAL(10, 2) DEFAULT 0; -- Change given (cash)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_last4 TEXT; -- Last 4 digits of card
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_brand TEXT; -- Card brand (visa, mastercard, etc.)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT; -- Receipt number for this payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS authorization_code TEXT; -- Payment authorization code
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_notes TEXT; -- Payment-specific notes

-- Add refund tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add timestamps
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- CREATE SUPPORTING TABLES
-- ============================================

-- Customers table (for loyalty/repeat customers)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'EG',
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees/Staff table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE, -- Employee ID number
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT, -- Cashier, Manager, Barista, etc.
  role TEXT CHECK (role IN ('cashier', 'barista', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  hire_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "VAT", "Sales Tax"
  rate DECIMAL(5, 2) NOT NULL, -- Percentage (e.g., 14.00 for 14%)
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- NULL means ongoing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts/Promotions table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT UNIQUE, -- Discount code (e.g., "SAVE10")
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL, -- Percentage or fixed amount
  min_order_amount DECIMAL(10, 2), -- Minimum order amount to apply
  max_discount_amount DECIMAL(10, 2), -- Maximum discount cap
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  usage_limit INTEGER, -- Max number of uses
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registers/Terminals table
CREATE TABLE IF NOT EXISTS registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Register 1", "POS Terminal 2"
  location TEXT, -- Physical location
  terminal_id TEXT UNIQUE, -- External terminal identifier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table (for tracking work shifts)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  register_id UUID REFERENCES registers(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  opening_cash DECIMAL(10, 2) DEFAULT 0, -- Opening cash amount
  closing_cash DECIMAL(10, 2), -- Closing cash amount
  expected_cash DECIMAL(10, 2), -- Expected cash based on transactions
  cash_difference DECIMAL(10, 2), -- Difference (expected - actual)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_employee ON orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_terminal ON orders(terminal_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_receipt_number ON orders(receipt_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_product_name ON order_items(product_name);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(ext_ref);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_store ON employees(store_id);
CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(employee_number);

-- Tax rates indexes
CREATE INDEX IF NOT EXISTS idx_tax_rates_store ON tax_rates(store_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active, start_date, end_date);

-- Discounts indexes
CREATE INDEX IF NOT EXISTS idx_discounts_store ON discounts(store_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active, start_date, end_date);

-- Registers indexes
CREATE INDEX IF NOT EXISTS idx_registers_store ON registers(store_id);
CREATE INDEX IF NOT EXISTS idx_registers_terminal_id ON registers(terminal_id);

-- Shifts indexes
CREATE INDEX IF NOT EXISTS idx_shifts_store ON shifts(store_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_register ON shifts(register_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);

-- ============================================
-- ADD TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Auto-calculate order_items subtotal and line_total
CREATE OR REPLACE FUNCTION calculate_order_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal (qty * price_each)
  NEW.subtotal := NEW.qty * NEW.price_each;
  
  -- Calculate line_total (subtotal - discount + tax)
  NEW.line_total := NEW.subtotal - COALESCE(NEW.discount_amount, 0) + COALESCE(NEW.tax_amount, 0);
  
  -- Update updated_at
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_item_totals
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_item_totals();

-- Auto-update updated_at for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Auto-update updated_at for payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Public read employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Public read tax_rates" ON tax_rates FOR SELECT USING (true);
CREATE POLICY "Public read discounts" ON discounts FOR SELECT USING (true);
CREATE POLICY "Public read registers" ON registers FOR SELECT USING (true);
CREATE POLICY "Public read shifts" ON shifts FOR SELECT USING (true);

-- Staff can manage these tables
CREATE POLICY "Staff manage customers" ON customers FOR ALL USING (true);
CREATE POLICY "Staff manage employees" ON employees FOR ALL USING (true);
CREATE POLICY "Staff manage tax_rates" ON tax_rates FOR ALL USING (true);
CREATE POLICY "Staff manage discounts" ON discounts FOR ALL USING (true);
CREATE POLICY "Staff manage registers" ON registers FOR ALL USING (true);
CREATE POLICY "Staff manage shifts" ON shifts FOR ALL USING (true);

