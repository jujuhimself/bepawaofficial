-- Enhance Product Sharing Logic
-- Add product visibility and sharing controls

-- Add product visibility fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_wholesale_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_retail_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public_product BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wholesaler_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS retailer_id UUID REFERENCES public.profiles(id);

-- Add comments for clarity
COMMENT ON COLUMN public.products.is_wholesale_product IS 'Whether this product is available for wholesale ordering';
COMMENT ON COLUMN public.products.is_retail_product IS 'Whether this product is available for retail customers';
COMMENT ON COLUMN public.products.is_public_product IS 'Whether this product is visible to individual customers';
COMMENT ON COLUMN public.products.wholesaler_id IS 'The wholesaler who created this product (for wholesale products)';
COMMENT ON COLUMN public.products.retailer_id IS 'The retailer who created this product (for retail products)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ix_products_wholesale_visibility ON public.products(is_wholesale_product, wholesaler_id);
CREATE INDEX IF NOT EXISTS ix_products_retail_visibility ON public.products(is_retail_product, retailer_id);
CREATE INDEX IF NOT EXISTS ix_products_public_visibility ON public.products(is_public_product);

-- Enhanced RLS policies for product sharing

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;

-- Wholesale products: visible to approved wholesalers and retailers
CREATE POLICY "Wholesale products visible to approved businesses" ON public.products
  FOR SELECT USING (
    (is_wholesale_product = true AND wholesaler_id IS NOT NULL) AND
    (
      -- Wholesaler can see their own products
      (auth.uid() = wholesaler_id) OR
      -- Retailers can see wholesale products from approved wholesalers
      (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'retail' 
        AND is_approved = true
      )) OR
      -- Admins can see all products
      (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      ))
    )
  );

-- Retail products: visible to retailers and individuals
CREATE POLICY "Retail products visible to retailers and individuals" ON public.products
  FOR SELECT USING (
    (is_retail_product = true OR is_public_product = true) AND
    (
      -- Retailer can see their own products
      (auth.uid() = retailer_id) OR
      -- Individuals can see public retail products
      (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'individual'
      )) OR
      -- Other retailers can see public retail products
      (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'retail' 
        AND is_approved = true
      )) OR
      -- Admins can see all products
      (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      ))
    )
  );

-- Product creation policies
CREATE POLICY "Wholesalers can create wholesale products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'wholesale' 
      AND is_approved = true
    ) AND is_wholesale_product = true AND wholesaler_id = auth.uid()
  );

CREATE POLICY "Retailers can create retail products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'retail' 
      AND is_approved = true
    ) AND (is_retail_product = true OR is_public_product = true) AND retailer_id = auth.uid()
  );

-- Product update policies
CREATE POLICY "Wholesalers can update their wholesale products" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'wholesale' 
      AND is_approved = true
    ) AND wholesaler_id = auth.uid()
  );

CREATE POLICY "Retailers can update their retail products" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'retail' 
      AND is_approved = true
    ) AND retailer_id = auth.uid()
  );

-- Stock synchronization function
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock when orders are placed
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'order_items' THEN
    UPDATE public.products 
    SET stock = stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
    
    -- Log stock movement
    INSERT INTO public.inventory_movements (
      user_id, product_id, movement_type, quantity, reason, reference_number
    ) VALUES (
      (SELECT user_id FROM public.orders WHERE id = NEW.order_id),
      NEW.product_id,
      'out',
      NEW.quantity,
      'Order fulfillment',
      NEW.order_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock synchronization
DROP TRIGGER IF EXISTS trigger_sync_product_stock ON public.order_items;
CREATE TRIGGER trigger_sync_product_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_stock();

-- Create product sharing audit table
CREATE TABLE IF NOT EXISTS public.product_sharing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES public.profiles(id),
  shared_with_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'order', 'update')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.product_sharing_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "Users can view their own sharing audit" ON public.product_sharing_audit
  FOR SELECT USING (
    shared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can insert sharing audit" ON public.product_sharing_audit
  FOR INSERT WITH CHECK (true);

-- Function to log product sharing
CREATE OR REPLACE FUNCTION log_product_sharing(
  p_product_id UUID,
  p_shared_by UUID,
  p_shared_with_role TEXT,
  p_action TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.product_sharing_audit (
    product_id, shared_by, shared_with_role, action
  ) VALUES (
    p_product_id, p_shared_by, p_shared_with_role, p_action
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing products to set proper visibility
UPDATE public.products 
SET 
  is_wholesale_product = CASE 
    WHEN user_id IN (SELECT id FROM public.profiles WHERE role = 'wholesale') THEN true 
    ELSE false 
  END,
  is_retail_product = CASE 
    WHEN user_id IN (SELECT id FROM public.profiles WHERE role = 'retail') THEN true 
    ELSE false 
  END,
  is_public_product = true,
  wholesaler_id = CASE 
    WHEN user_id IN (SELECT id FROM public.profiles WHERE role = 'wholesale') THEN user_id 
    ELSE NULL 
  END,
  retailer_id = CASE 
    WHEN user_id IN (SELECT id FROM public.profiles WHERE role = 'retail') THEN user_id 
    ELSE NULL 
  END
WHERE wholesaler_id IS NULL AND retailer_id IS NULL; 