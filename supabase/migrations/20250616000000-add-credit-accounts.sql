-- Add credit account fields to customers table
ALTER TABLE customers
ADD COLUMN credit_limit numeric(15, 2) DEFAULT 0,
ADD COLUMN current_balance numeric(15, 2) DEFAULT 0,
ADD COLUMN payment_terms integer DEFAULT 30,
ADD COLUMN credit_status text CHECK (credit_status IN ('good', 'warning', 'overdue')) DEFAULT 'good';

-- Create credit transactions table
CREATE TABLE credit_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
    type text CHECK (type IN ('purchase', 'payment')),
    amount numeric(15, 2) NOT NULL,
    date timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    status text CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create function to update credit status based on overdue payments
CREATE OR REPLACE FUNCTION update_customer_credit_status()
RETURNS trigger AS $$
BEGIN
    -- Update customer credit status based on overdue payments
    UPDATE customers c
    SET credit_status = CASE
        WHEN EXISTS (
            SELECT 1 FROM credit_transactions ct
            WHERE ct.customer_id = c.id
            AND ct.type = 'purchase'
            AND ct.status = 'overdue'
        ) THEN 'overdue'
        WHEN c.current_balance >= c.credit_limit * 0.8 THEN 'warning'
        ELSE 'good'
    END
    WHERE c.id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update credit status
CREATE TRIGGER update_credit_status_trigger
AFTER INSERT OR UPDATE ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_customer_credit_status();

-- Create function to update current balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS trigger AS $$
BEGIN
    IF NEW.type = 'purchase' THEN
        UPDATE customers
        SET current_balance = current_balance + NEW.amount
        WHERE id = NEW.customer_id;
    ELSIF NEW.type = 'payment' THEN
        UPDATE customers
        SET current_balance = current_balance - NEW.amount
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update balance
CREATE TRIGGER update_balance_trigger
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance();

-- Create function to check credit limit before purchase
CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS trigger AS $$
BEGIN
    IF NEW.type = 'purchase' THEN
        IF (
            SELECT current_balance + NEW.amount
            FROM customers
            WHERE id = NEW.customer_id
        ) > (
            SELECT credit_limit
            FROM customers
            WHERE id = NEW.customer_id
        ) THEN
            RAISE EXCEPTION 'Purchase would exceed credit limit';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check credit limit
CREATE TRIGGER check_credit_limit_trigger
BEFORE INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION check_credit_limit(); 