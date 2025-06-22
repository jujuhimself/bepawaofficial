CREATE TYPE public.purchase_order_status AS ENUM (
    'pending',
    'approved',
    'ordered',
    'received',
    'cancelled',
    'requested'
);

ALTER TABLE public.purchase_orders
  ADD COLUMN retailer_id UUID REFERENCES public.profiles(id),
  ADD COLUMN wholesaler_id UUID REFERENCES public.profiles(id),
  ADD COLUMN status purchase_order_status NOT NULL DEFAULT 'pending';

COMMENT ON COLUMN public.purchase_orders.user_id IS 'The ID of the user who created the purchase order (the retailer).';
COMMENT ON COLUMN public.purchase_orders.wholesaler_id IS 'The ID of the wholesaler the order is being sent to.';
COMMENT ON COLUMN public.purchase_orders.retailer_id IS 'The ID of the retailer placing the order (redundant with user_id, but for clarity).'; 