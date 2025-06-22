-- Check Products Table Structure
-- Run this first to see what columns already exist

-- 1. Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';

-- 3. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';

-- 4. Check existing indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'products';

-- 5. Sample data check
SELECT COUNT(*) as total_products FROM public.products;

-- 6. Check sample products
SELECT id, name, category, sku, stock, min_stock_level, buy_price, sell_price 
FROM public.products 
LIMIT 5; 