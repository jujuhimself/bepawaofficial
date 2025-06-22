-- Fix database issues for Pharm Flow Connect
-- Run this in your Supabase SQL Editor

-- 1. Fix product_analytics table to support pharmacy_id column
ALTER TABLE public.product_analytics 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update the function to use pharmacy_id instead of user_id
CREATE OR REPLACE FUNCTION get_product_analytics_by_pharmacy(pharmacy_uuid uuid)
returns setof product_analytics as $$
begin
  return query select * from product_analytics pa where pa.pharmacy_id = pharmacy_uuid;
end;
$$ language plpgsql;

-- 3. Ensure get_orders_by_wholesaler function exists and is properly defined
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

-- 4. Add function to get orders by retailer
CREATE OR REPLACE FUNCTION get_orders_by_retailer(retailer_uuid uuid)
returns setof orders as $$
begin
  return query
  select o.*
  from orders o
  where o.user_id = retailer_uuid;
end;
$$ language plpgsql;

-- 5. Add function to get products by wholesaler
CREATE OR REPLACE FUNCTION get_products_by_wholesaler(wholesaler_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.wholesaler_id = wholesaler_uuid OR p.user_id = wholesaler_uuid;
end;
$$ language plpgsql;

-- 6. Add function to get products by retailer
CREATE OR REPLACE FUNCTION get_products_by_retailer(retailer_uuid uuid)
returns setof products as $$
begin
  return query
  select p.*
  from products p
  where p.user_id = retailer_uuid OR p.pharmacy_id = retailer_uuid;
end;
$$ language plpgsql;

-- 7. Ensure products table has proper columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS wholesaler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. Update RLS policies for product_analytics to include pharmacy_id
DROP POLICY IF EXISTS "Users can view their product analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Users can manage their product analytics" ON public.product_analytics;

CREATE POLICY "Users can view their product analytics" ON public.product_analytics
  FOR SELECT USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

CREATE POLICY "Users can manage their product analytics" ON public.product_analytics
  FOR ALL USING (user_id = auth.uid() OR pharmacy_id = auth.uid());

-- 9. Create RLS policies for products table
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;

CREATE POLICY "Users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their products" ON public.products
  FOR ALL USING (user_id = auth.uid() OR wholesaler_id = auth.uid() OR pharmacy_id = auth.uid());

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_analytics_pharmacy_id ON public.product_analytics(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_wholesaler_id ON public.products(wholesaler_id);
CREATE INDEX IF NOT EXISTS idx_products_pharmacy_id ON public.products(pharmacy_id);

-- 11. Create function to insert product with proper user assignment
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
    price, 
    category, 
    stock, 
    min_stock_level, 
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
    p_user_id,
    p_wholesaler_id,
    p_pharmacy_id,
    now(),
    now()
  ) RETURNING id INTO product_id;
  
  RETURN product_id;
END;
$$;

-- 12. Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Database fixes applied successfully!' as status; 