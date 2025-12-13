-- Add Purchase Orders System
--
-- Overview:
-- Adds purchase order tracking to the system
--
-- New Tables:
-- 1. purchase_orders - Tracks purchase orders from suppliers
--    - id (uuid, primary key)
--    - po_number (text, unique) - Purchase order number
--    - supplier_id (uuid, foreign key) - Reference to suppliers
--    - order_date (date) - Date of order
--    - expected_delivery_date (date, optional) - Expected delivery
--    - status (text) - pending, received, partial, cancelled
--    - total_amount (decimal, optional) - Total order amount
--    - notes (text, optional)
--    - created_at (timestamptz)
--
-- Modified Tables:
-- 2. inventory_items - Add po_id field to link items to purchase orders
--
-- Security:
-- Enable RLS and add public access policies

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  order_date date NOT NULL,
  expected_delivery_date date,
  status text DEFAULT 'pending' NOT NULL,
  total_amount decimal(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add po_id to inventory_items if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'po_id'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN po_id uuid REFERENCES purchase_orders(id);
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_po ON inventory_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Enable Row Level Security
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_orders
CREATE POLICY "Allow all access to purchase_orders"
  ON purchase_orders FOR ALL
  USING (true)
  WITH CHECK (true);