-- Add customer_name and customer_phone columns to pos_sales
ALTER TABLE pos_sales ADD COLUMN customer_name text;
ALTER TABLE pos_sales ADD COLUMN customer_phone text; 