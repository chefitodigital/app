/*
  # Create orders and consume coupons atomically

  Keeps the coupon counter and order insertion in one database transaction,
  preventing coupon loss on a failed order and concurrent overuse.
*/

CREATE OR REPLACE FUNCTION public.create_order_with_coupon(
  p_order jsonb,
  p_coupon_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.discount_coupons
    SET usage_count = usage_count + 1
    WHERE id = p_coupon_id
      AND active = true
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    RETURNING id INTO v_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'coupon_unavailable' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.orders (
    customer_id, customer_name, customer_email, customer_phone, address, notes,
    order_type, items, subtotal, discount_amount, total, delivery_fee,
    coupon_code, payment_method, order_sequence, public_slug
  ) VALUES (
    NULLIF(p_order->>'customer_id', '')::uuid,
    p_order->>'customer_name',
    p_order->>'customer_email',
    p_order->>'customer_phone',
    p_order->>'address',
    NULLIF(p_order->>'notes', ''),
    p_order->>'order_type',
    COALESCE(p_order->'items', '[]'::jsonb),
    COALESCE((p_order->>'subtotal')::numeric, 0),
    COALESCE((p_order->>'discount_amount')::numeric, 0),
    COALESCE((p_order->>'total')::numeric, 0),
    COALESCE((p_order->>'delivery_fee')::numeric, 0),
    NULLIF(p_order->>'coupon_code', ''),
    COALESCE(p_order->>'payment_method', 'cash'),
    NULLIF(p_order->>'order_sequence', '')::integer,
    NULLIF(p_order->>'public_slug', '')
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_coupon(jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_coupon(jsonb, uuid) TO authenticated;
