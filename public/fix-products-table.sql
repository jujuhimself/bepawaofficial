-- Fix Products Table Issues
-- Run this in your Supabase SQL Editor

-- Drop existing products tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS public.products CASCADE;

-- Create a unified products table with all necessary columns
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  sku VARCHAR UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER,
  buy_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2) NOT NULL,
  manufacturer VARCHAR,
  requires_prescription BOOLEAN DEFAULT false,
  dosage_form VARCHAR,
  strength VARCHAR,
  pack_size VARCHAR,
  supplier TEXT,
  expiry_date DATE,
  batch_number TEXT,
  last_ordered DATE,
  status TEXT NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock', 'expired')),
  image_url TEXT,
  is_wholesale_product BOOLEAN DEFAULT false,
  is_retail_product BOOLEAN DEFAULT false,
  is_public_product BOOLEAN DEFAULT false,
  wholesaler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pharmacy_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_wholesaler_id ON public.products(wholesaler_id);
CREATE INDEX idx_products_pharmacy_id ON public.products(pharmacy_id);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (
    user_id = auth.uid() OR 
    wholesaler_id = auth.uid() OR 
    pharmacy_id = auth.uid()
  );

-- Create function to update product status based on stock levels
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on stock levels
  IF NEW.stock <= 0 THEN
    NEW.status := 'out-of-stock';
  ELSIF NEW.stock <= NEW.min_stock_level THEN
    NEW.status := 'low-stock';
  ELSE
    NEW.status := 'in-stock';
  END IF;
  
  -- Check if product is expired
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE THEN
    NEW.status := 'expired';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update product status
CREATE TRIGGER trigger_update_product_status
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_status();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products for testing
INSERT INTO public.products (
  name, 
  description, 
  category, 
  sku, 
  stock, 
  min_stock_level, 
  buy_price, 
  sell_price, 
  manufacturer, 
  requires_prescription, 
  dosage_form, 
  strength, 
  pack_size,
  is_public_product
) VALUES 
  ('Paracetamol', 'Pain relief and fever reduction', 'Pain Relief', 'PR001', 100, 20, 50.00, 100.00, 'Generic', false, 'Tablet', '500mg', '100 tablets', true),
  ('Amoxicillin', 'Antibiotic for bacterial infections', 'Antibiotics', 'AB001', 50, 10, 150.00, 300.00, 'Generic', true, 'Capsule', '500mg', '20 capsules', true),
  ('Omeprazole', 'For acid reflux and ulcers', 'Digestive Health', 'DH001', 75, 15, 200.00, 400.00, 'Generic', false, 'Capsule', '20mg', '30 capsules', true),
  ('Metformin', 'Diabetes medication', 'Diabetes', 'DB001', 60, 12, 250.00, 500.00, 'Generic', true, 'Tablet', '500mg', '60 tablets', true),
  ('Salbutamol Inhaler', 'For asthma relief', 'Respiratory', 'RP001', 40, 8, 300.00, 600.00, 'Generic', true, 'Inhaler', '100mcg', '200 doses', true),
  ('Vitamin C', 'Immune system support', 'Vitamins', 'VT001', 200, 30, 100.00, 200.00, 'Generic', false, 'Tablet', '1000mg', '100 tablets', true),
  ('Ibuprofen', 'Pain and inflammation relief', 'Pain Relief', 'PR002', 150, 25, 80.00, 160.00, 'Generic', false, 'Tablet', '400mg', '30 tablets', true),
  ('Cetirizine', 'Antihistamine for allergies', 'Allergy', 'AL001', 80, 15, 120.00, 240.00, 'Generic', false, 'Tablet', '10mg', '30 tablets', true),
  ('Metronidazole', 'Antibiotic for infections', 'Antibiotics', 'AB002', 45, 9, 180.00, 360.00, 'Generic', true, 'Tablet', '400mg', '21 tablets', true),
  ('Amlodipine', 'Blood pressure medication', 'Cardiovascular', 'CV001', 70, 14, 220.00, 440.00, 'Generic', true, 'Tablet', '5mg', '30 tablets', true);

-- Create function to insert product with proper user assignment
CREATE OR REPLACE FUNCTION insert_product_with_user(
  p_name text,
  p_description text,
  p_price numeric,
  p_category text,
  p_stock integer,
  p_min_stock_level integer,
  p_user_id uuid,
  p_wholesaler_id uuid DEFAULT NULL,
  p_pharmacy_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_id uuid;
BEGIN
  INSERT INTO public.products (
    name, 
    description, 
    sell_price, 
    category, 
    stock, 
    min_stock_level, 
    buy_price,
    user_id, 
    wholesaler_id,
    pharmacy_id,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_description,
    p_price,
    p_category,
    p_stock,
    p_min_stock_level,
    p_price * 0.5, -- Assume 50% markup
    p_user_id,
    p_wholesaler_id,
    p_pharmacy_id,
    now(),
    now()
  ) RETURNING id INTO product_id;
  
  RETURN product_id;
END;
$$;

-- Success message
SELECT 'Products table created successfully with sample data!' as status; 