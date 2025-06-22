-- Fix Database Issues for Pharm Flow Connect
-- Run this in your Supabase SQL Editor

-- 1. Drop and recreate products table
DROP TABLE IF EXISTS public.products CASCADE;

CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  sku VARCHAR UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  buy_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2) NOT NULL,
  is_wholesale_product BOOLEAN DEFAULT false,
  is_retail_product BOOLEAN DEFAULT false,
  is_public_product BOOLEAN DEFAULT false,
  wholesaler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pharmacy_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Users can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (
    user_id = auth.uid() OR 
    wholesaler_id = auth.uid() OR 
    pharmacy_id = auth.uid()
  );

-- 4. Insert sample products
INSERT INTO public.products (
  name, 
  description, 
  category, 
  sku, 
  stock, 
  min_stock_level, 
  buy_price, 
  sell_price, 
  is_public_product
) VALUES 
  ('Paracetamol', 'Pain relief and fever reduction', 'Pain Relief', 'PR001', 100, 20, 50.00, 100.00, true),
  ('Amoxicillin', 'Antibiotic for bacterial infections', 'Antibiotics', 'AB001', 50, 10, 150.00, 300.00, true),
  ('Omeprazole', 'For acid reflux and ulcers', 'Digestive Health', 'DH001', 75, 15, 200.00, 400.00, true),
  ('Vitamin C', 'Immune system support', 'Vitamins', 'VT001', 200, 30, 100.00, 200.00, true),
  ('Ibuprofen', 'Pain and inflammation relief', 'Pain Relief', 'PR002', 150, 25, 80.00, 160.00, true);

-- 5. Create profiles table if it doesn't exist
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

-- 6. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for profiles
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Success message
SELECT 'Database setup completed successfully!' as status; 