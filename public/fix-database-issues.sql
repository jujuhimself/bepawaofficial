-- Fix Database Issues for Pharm Flow Connect
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to existing products table (safe approach)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS wholesaler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_wholesale_product BOOLEAN DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_retail_product BOOLEAN DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_public_product BOOLEAN DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS buy_price DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_wholesaler_id ON public.products(wholesaler_id);
CREATE INDEX IF NOT EXISTS idx_products_pharmacy_id ON public.products(pharmacy_id);

-- 3. Enable Row Level Security (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;

-- 5. Create RLS policies
CREATE POLICY "Users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (
    user_id = auth.uid() OR 
    wholesaler_id = auth.uid() OR 
    pharmacy_id = auth.uid()
  );

-- 6. Update existing products to be public if they don't have flags set
UPDATE public.products 
SET is_public_product = true 
WHERE is_public_product IS NULL 
  AND is_retail_product IS NULL 
  AND is_wholesale_product IS NULL;

-- 7. Fix product_analytics table to support pharmacy_id column
ALTER TABLE public.product_analytics 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Update the function to use pharmacy_id instead of user_id
CREATE OR REPLACE FUNCTION get_product_analytics_by_pharmacy(pharmacy_uuid uuid)
returns setof product_analytics as $$
begin
  return query select * from product_analytics pa where pa.pharmacy_id = pharmacy_uuid;
end;
$$ language plpgsql;

-- 9. Ensure get_orders_by_wholesaler function exists and is properly defined
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

-- 10. Add function to get orders by retailer
CREATE OR REPLACE FUNCTION get_orders_by_retailer(retailer_uuid uuid)
returns setof orders as $$
begin
  return query
  select o.*
  from orders o
  where o.user_id = retailer_uuid;
end;
$$ language plpgsql;

-- 11. Add function to get products by wholesaler
CREATE OR REPLACE FUNCTION get_products_by_wholesaler(wholesaler_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.wholesaler_id = wholesaler_uuid OR p.user_id = wholesaler_uuid;
end;
$$ language plpgsql;

-- 12. Add function to get products by retailer
CREATE OR REPLACE FUNCTION get_products_by_retailer(retailer_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.user_id = retailer_uuid OR p.pharmacy_id = retailer_uuid;
end;
$$ language plpgsql;

-- 13. Update RLS policies for product_analytics to include pharmacy_id
DROP POLICY IF EXISTS "Users can view their product analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Users can manage their product analytics" ON public.product_analytics;

CREATE POLICY "Users can view their product analytics" ON public.product_analytics
  FOR SELECT USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

CREATE POLICY "Users can manage their product analytics" ON public.product_analytics
  FOR ALL USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_analytics_pharmacy_id ON public.product_analytics(pharmacy_id);

-- 15. Create function to update product status based on stock levels
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

-- 16. Create trigger to update product status (drop if exists first)
DROP TRIGGER IF EXISTS trigger_update_product_status ON public.products;
CREATE TRIGGER trigger_update_product_status
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_status();

-- 17. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 18. Create trigger to automatically update updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 19. Ensure profiles table exists and has necessary columns
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

-- 20. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 21. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 22. Insert sample profiles for testing (only if they don't exist)
INSERT INTO public.profiles (id, name, business_name, role, region, city, is_approved) VALUES 
  (gen_random_uuid(), 'John Doe', 'City Pharmacy', 'retail', 'Central', 'Nairobi', true),
  (gen_random_uuid(), 'Jane Smith', 'Health Plus', 'retail', 'Westlands', 'Nairobi', true),
  (gen_random_uuid(), 'Mike Johnson', 'MediCare', 'retail', 'Eastlands', 'Nairobi', true)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database fixes applied successfully! Existing products table preserved.' as status; 