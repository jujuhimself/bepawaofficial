-- Fix and enhance core tables

-- Enhance orders table with better status tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enhance inventory tracking
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_restock_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS stock_location TEXT;

-- Create inventory_transactions table for better tracking
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id),
    transaction_type TEXT CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return', 'transfer')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    reference_id UUID, -- Can reference order_id, adjustment_id, etc.
    reference_type TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhance credit management
CREATE TABLE IF NOT EXISTS credit_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_review_date TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_limit_id UUID REFERENCES credit_limits(id),
    transaction_type TEXT CHECK (transaction_type IN ('purchase', 'payment', 'adjustment', 'fee')),
    amount DECIMAL(10,2) NOT NULL,
    previous_balance DECIMAL(10,2) NOT NULL,
    new_balance DECIMAL(10,2) NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Inventory transaction policies
CREATE POLICY "Staff can view inventory transactions for their business" ON inventory_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.user_id = auth.uid()
            AND staff.business_id = (
                SELECT business_id FROM inventory WHERE id = inventory_transactions.inventory_id
            )
        )
    );

CREATE POLICY "Staff can insert inventory transactions for their business" ON inventory_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.user_id = auth.uid()
            AND staff.business_id = (
                SELECT business_id FROM inventory WHERE id = inventory_transactions.inventory_id
            )
            AND staff.role IN ('owner', 'manager', 'worker')
        )
    );

-- Credit management policies
CREATE POLICY "Staff can view credit limits for their business" ON credit_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.user_id = auth.uid()
            AND staff.business_id = credit_limits.business_id
        )
    );

CREATE POLICY "Staff can view credit transactions for their business" ON credit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.user_id = auth.uid()
            AND staff.business_id = (
                SELECT business_id FROM credit_limits WHERE id = credit_transactions.credit_limit_id
            )
        )
    );

-- Add functions for automated processes
CREATE OR REPLACE FUNCTION update_inventory_on_order() RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory quantities
    UPDATE inventory
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Create inventory transaction
    INSERT INTO inventory_transactions (
        inventory_id,
        transaction_type,
        quantity,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_type,
        created_by
    )
    SELECT
        NEW.product_id,
        'sale',
        NEW.quantity,
        i.quantity + NEW.quantity,
        i.quantity,
        NEW.order_id,
        'order',
        auth.uid()
    FROM inventory i
    WHERE i.id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
DROP TRIGGER IF EXISTS update_inventory_trigger ON order_items;
CREATE TRIGGER update_inventory_trigger
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_order();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_limits_business_id ON credit_limits(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_credit_limit_id ON credit_transactions(credit_limit_id); 