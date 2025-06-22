-- Function to get sales analytics for a specific pharmacy
create or replace function get_sales_analytics_by_pharmacy(pharmacy_uuid uuid)
returns setof sales_analytics as $$
begin
  return query select * from sales_analytics sa where sa.pharmacy_id = pharmacy_uuid;
end;
$$ language plpgsql;

-- Function to get product analytics for a specific pharmacy
create or replace function get_product_analytics_by_pharmacy(pharmacy_uuid uuid)
returns setof product_analytics as $$
begin
  return query select * from product_analytics pa where pa.pharmacy_id = pharmacy_uuid;
end;
$$ language plpgsql;

-- Function to get low stock products for a specific pharmacy
create or replace function get_low_stock_products_by_pharmacy(pharmacy_uuid uuid)
returns setof products as $$
begin
  return query select * from products p where p.pharmacy_id = pharmacy_uuid and p.stock <= p.min_stock_level;
end;
$$ language plpgsql; 