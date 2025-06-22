-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR UNIQUE,
  manufacturer VARCHAR,
  requires_prescription BOOLEAN DEFAULT false,
  dosage_form VARCHAR,
  strength VARCHAR,
  pack_size VARCHAR,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories for pharmacy products
INSERT INTO products (name, description, category, price, stock, sku, manufacturer, requires_prescription, dosage_form, strength, pack_size) 
VALUES 
  ('Paracetamol', 'Pain relief and fever reduction', 'Pain Relief', 5000, 100, 'PR001', 'Generic', false, 'Tablet', '500mg', '100 tablets'),
  ('Amoxicillin', 'Antibiotic for bacterial infections', 'Antibiotics', 15000, 50, 'AB001', 'Generic', true, 'Capsule', '500mg', '20 capsules'),
  ('Omeprazole', 'For acid reflux and ulcers', 'Digestive Health', 20000, 75, 'DH001', 'Generic', false, 'Capsule', '20mg', '30 capsules'),
  ('Metformin', 'Diabetes medication', 'Diabetes', 25000, 60, 'DB001', 'Generic', true, 'Tablet', '500mg', '60 tablets'),
  ('Salbutamol Inhaler', 'For asthma relief', 'Respiratory', 30000, 40, 'RP001', 'Generic', true, 'Inhaler', '100mcg', '200 doses'),
  ('Vitamin C', 'Immune system support', 'Vitamins', 10000, 200, 'VT001', 'Generic', false, 'Tablet', '1000mg', '100 tablets'),
  ('Ibuprofen', 'Pain and inflammation relief', 'Pain Relief', 8000, 150, 'PR002', 'Generic', false, 'Tablet', '400mg', '30 tablets'),
  ('Cetirizine', 'Antihistamine for allergies', 'Allergy', 12000, 80, 'AL001', 'Generic', false, 'Tablet', '10mg', '30 tablets'),
  ('Metronidazole', 'Antibiotic for infections', 'Antibiotics', 18000, 45, 'AB002', 'Generic', true, 'Tablet', '400mg', '21 tablets'),
  ('Amlodipine', 'Blood pressure medication', 'Cardiovascular', 22000, 70, 'CV001', 'Generic', true, 'Tablet', '5mg', '30 tablets');

-- Add RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Only pharmacy staff can insert products"
  ON products FOR INSERT
  USING (
    auth.role() IN ('pharmacy_staff', 'pharmacy_admin')
  );

CREATE POLICY "Only pharmacy staff can update products"
  ON products FOR UPDATE
  USING (
    auth.role() IN ('pharmacy_staff', 'pharmacy_admin')
  );

CREATE POLICY "Only pharmacy admin can delete products"
  ON products FOR DELETE
  USING (
    auth.role() = 'pharmacy_admin'
  );

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
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 