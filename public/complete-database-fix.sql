-- Complete Database Fix Script for Pharm Flow Connect
-- Run this in your Supabase SQL Editor

-- 1. Drop existing products tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS public.products CASCADE;

-- 2. Create a unified products table with all necessary columns
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

-- 3. Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_wholesaler_id ON public.products(wholesaler_id);
CREATE INDEX idx_products_pharmacy_id ON public.products(pharmacy_id);

-- 4. Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for products
CREATE POLICY "Users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (
    user_id = auth.uid() OR 
    wholesaler_id = auth.uid() OR 
    pharmacy_id = auth.uid()
  );

-- 6. Fix product_analytics table to support pharmacy_id column
ALTER TABLE public.product_analytics 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Update the function to use pharmacy_id instead of user_id
CREATE OR REPLACE FUNCTION get_product_analytics_by_pharmacy(pharmacy_uuid uuid)
returns setof product_analytics as $$
begin
  return query select * from product_analytics pa where pa.pharmacy_id = pharmacy_uuid;
end;
$$ language plpgsql;

-- 8. Ensure get_orders_by_wholesaler function exists and is properly defined
CREATE OR REPLACE FUNCTION get_orders_by_wholesaler(wholesaler_uuid uuid)
returns setof orders as $$
begin
  return query
  select o.*
  from orders o
  where exists (
    select 1
    from order_items oi
    join products p on oi.product_id = p.id
    where oi.order_id = o.id and p.wholesaler_id = wholesaler_uuid
  );
end;
$$ language plpgsql;

-- 9. Add function to get orders by retailer
CREATE OR REPLACE FUNCTION get_orders_by_retailer(retailer_uuid uuid)
returns setof orders as $$
begin
  return query
  select o.*
  from orders o
  where o.user_id = retailer_uuid;
end;
$$ language plpgsql;

-- 10. Add function to get products by wholesaler
CREATE OR REPLACE FUNCTION get_products_by_wholesaler(wholesaler_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.wholesaler_id = wholesaler_uuid OR p.user_id = wholesaler_uuid;
end;
$$ language plpgsql;

-- 11. Add function to get products by retailer
CREATE OR REPLACE FUNCTION get_products_by_retailer(retailer_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.user_id = retailer_uuid OR p.pharmacy_id = retailer_uuid;
end;
$$ language plpgsql;

-- 12. Update RLS policies for product_analytics to include pharmacy_id
DROP POLICY IF EXISTS "Users can view their product analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Users can manage their product analytics" ON public.product_analytics;

CREATE POLICY "Users can view their product analytics" ON public.product_analytics
  FOR SELECT USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

CREATE POLICY "Users can manage their product analytics" ON public.product_analytics
  FOR ALL USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_analytics_pharmacy_id ON public.product_analytics(pharmacy_id);

-- 14. Create function to update product status based on stock levels
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

-- 15. Create trigger to update product status
CREATE TRIGGER trigger_update_product_status
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_status();

-- 16. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 18. Insert sample products for testing
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

-- 19. Create function to insert product with proper user assignment
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

-- 20. Ensure profiles table exists and has necessary columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  business_name TEXT,
  role TEXT CHECK (role IN ('individual', 'retail', 'wholesale', 'admin')),
  region TEXT,
  city TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 22. Create RLS policies for profiles
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 23. Insert sample profiles for testing
INSERT INTO public.profiles (id, name, business_name, role, region, city, is_approved) VALUES 
  (gen_random_uuid(), 'John Doe', 'City Pharmacy', 'retail', 'Central', 'Nairobi', true),
  (gen_random_uuid(), 'Jane Smith', 'Health Plus', 'retail', 'Westlands', 'Nairobi', true),
  (gen_random_uuid(), 'Mike Johnson', 'MediCare', 'retail', 'Eastlands', 'Nairobi', true)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Complete database setup finished successfully!' as status; 