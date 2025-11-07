-- ============================================
-- INVENTORY MANAGEMENT SYSTEM
-- ============================================

-- Add inventory fields to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS out_of_stock BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMPTZ;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create inventory_adjustments table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('restock', 'sale', 'waste', 'correction')),
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for reductions
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  adjusted_by TEXT, -- Employee ID or system
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_snapshots for historical tracking
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, snapshot_date)
);

-- ============================================
-- ENHANCED ORDER STATUS TRACKING
-- ============================================

-- Add more detailed status tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_started_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Add status history tracking
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT, -- Employee ID or system
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update stock when an order is placed
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Get menu item details
  SELECT mi.* INTO item_record
  FROM menu_items mi
  WHERE mi.id = NEW.menu_item_id;
  
  -- Only decrement if inventory tracking is enabled
  IF item_record.track_inventory THEN
    -- Decrement stock
    UPDATE menu_items
    SET 
      stock_quantity = GREATEST(0, stock_quantity - NEW.qty),
      out_of_stock = CASE 
        WHEN (stock_quantity - NEW.qty) <= 0 THEN true 
        ELSE false 
      END,
      updated_at = NOW()
    WHERE id = NEW.menu_item_id;
    
    -- Log the adjustment
    INSERT INTO inventory_adjustments (
      menu_item_id,
      adjustment_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      adjusted_by
    ) VALUES (
      NEW.menu_item_id,
      'sale',
      -NEW.qty,
      item_record.stock_quantity,
      GREATEST(0, item_record.stock_quantity - NEW.qty),
      'Order placed - Order Item ID: ' || NEW.id::TEXT,
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement stock on order item creation
CREATE TRIGGER trigger_decrement_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.employee_id, 'system'),
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
    
    -- Update timestamps based on status
    IF NEW.status = 'in_prep' AND OLD.status != 'in_prep' THEN
      NEW.preparing_started_at = NOW();
    ELSIF NEW.status = 'ready' AND OLD.status != 'ready' THEN
      NEW.ready_at = NOW();
    ELSIF NEW.status = 'served' AND OLD.status != 'served' THEN
      NEW.served_at = NOW();
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.completed_at = NOW();
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      NEW.cancelled_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Function to update menu_items updated_at
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update menu_items updated_at
CREATE TRIGGER trigger_update_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_menu_items_updated_at();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item ON inventory_adjustments(menu_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_item_date ON inventory_snapshots(menu_item_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_stock ON menu_items(out_of_stock, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_orders_status_dates ON orders(status, preparing_started_at, ready_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Public read for inventory status (customers need to see out of stock items)
CREATE POLICY "Public read menu_items inventory" ON menu_items FOR SELECT USING (true);

-- Staff/admin can manage inventory
CREATE POLICY "Staff manage inventory_adjustments" ON inventory_adjustments FOR ALL USING (true);
CREATE POLICY "Staff read inventory_snapshots" ON inventory_snapshots FOR SELECT USING (true);
CREATE POLICY "Staff read order_status_history" ON order_status_history FOR SELECT USING (true);

-- ============================================
-- HELPER FUNCTIONS FOR API
-- ============================================

-- Function to restock an item
CREATE OR REPLACE FUNCTION restock_item(
  p_menu_item_id UUID,
  p_quantity INTEGER,
  p_adjusted_by TEXT DEFAULT 'staff',
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_quantity INTEGER,
  message TEXT
) AS $$
DECLARE
  v_previous_quantity INTEGER;
  v_new_quantity INTEGER;
BEGIN
  -- Get current quantity
  SELECT stock_quantity INTO v_previous_quantity
  FROM menu_items
  WHERE id = p_menu_item_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Menu item not found';
    RETURN;
  END IF;
  
  -- Calculate new quantity
  v_new_quantity := v_previous_quantity + p_quantity;
  
  -- Update the item
  UPDATE menu_items
  SET 
    stock_quantity = v_new_quantity,
    out_of_stock = false,
    last_restocked_at = NOW(),
    updated_at = NOW()
  WHERE id = p_menu_item_id;
  
  -- Log the adjustment
  INSERT INTO inventory_adjustments (
    menu_item_id,
    adjustment_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    adjusted_by
  ) VALUES (
    p_menu_item_id,
    'restock',
    p_quantity,
    v_previous_quantity,
    v_new_quantity,
    COALESCE(p_reason, 'Manual restock'),
    p_adjusted_by
  );
  
  RETURN QUERY SELECT true, v_new_quantity, 'Item restocked successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to mark item as out of stock
CREATE OR REPLACE FUNCTION mark_out_of_stock(
  p_menu_item_id UUID,
  p_adjusted_by TEXT DEFAULT 'staff'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE menu_items
  SET 
    out_of_stock = true,
    stock_quantity = 0,
    updated_at = NOW()
  WHERE id = p_menu_item_id;
  
  -- Log the adjustment
  INSERT INTO inventory_adjustments (
    menu_item_id,
    adjustment_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    adjusted_by
  ) VALUES (
    p_menu_item_id,
    'correction',
    -stock_quantity,
    stock_quantity,
    0,
    'Marked as out of stock',
    p_adjusted_by
  ) FROM menu_items WHERE id = p_menu_item_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

