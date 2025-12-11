-- MacBook Depot Database Schema
--
-- Overview:
-- Complete database schema for MacBook inventory management system
--
-- Tables:
-- 1. suppliers - Supplier information
-- 2. inventory_items - MacBook inventory with full details
-- 3. customers - Customer information
-- 4. sales - Sales transactions
--
-- Security:
-- RLS enabled on all tables with public access policies

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  supplier_type text NOT NULL,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  supplier_item_number text NOT NULL,
  model_family text NOT NULL,
  screen_size text NOT NULL,
  chip text NOT NULL,
  ram_gb integer NOT NULL,
  storage_gb integer NOT NULL,
  year integer NOT NULL,
  serial_number text,
  color text,
  keyboard_layout text,
  os_installed text,
  condition_grade text NOT NULL,
  condition_summary text NOT NULL,
  battery_cycle_count integer,
  battery_health_percent integer,
  charger_included boolean DEFAULT false,
  box_included boolean DEFAULT false,
  purchase_cost decimal(10,2) NOT NULL,
  purchase_date date NOT NULL,
  status text DEFAULT 'in_stock' NOT NULL,
  sold_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  customer_type text NOT NULL,
  source text NOT NULL,
  ig_handle text,
  preferred_contact text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  sale_price decimal(10,2) NOT NULL,
  sale_date date NOT NULL,
  payment_method text NOT NULL,
  channel text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_sales_item ON sales(item_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers (public access for single-user system)
CREATE POLICY "Allow all access to suppliers"
  ON suppliers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for inventory_items
CREATE POLICY "Allow all access to inventory_items"
  ON inventory_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for customers
CREATE POLICY "Allow all access to customers"
  ON customers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for sales
CREATE POLICY "Allow all access to sales"
  ON sales FOR ALL
  USING (true)
  WITH CHECK (true);