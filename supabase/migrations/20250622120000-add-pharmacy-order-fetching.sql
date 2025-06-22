create or replace function get_orders_for_pharmacy(pharmacy_uuid uuid)
returns setof orders as $$
begin
  return query
  select o.*
  from orders o
  where exists (
    select 1
    from order_items oi
    join products p on oi.product_id = p.id
    where oi.order_id = o.id and p.pharmacy_id = pharmacy_uuid
  );
end;
$$ language plpgsql;