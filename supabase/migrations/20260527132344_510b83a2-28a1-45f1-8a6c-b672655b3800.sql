
-- 1) Listing fee RPC
CREATE OR REPLACE FUNCTION public.charge_listing_fee(_user_id uuid, _kind text, _ref_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
  v_wallet_id uuid;
  v_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF _kind = 'garage' THEN v_amount := 100;
  ELSIF _kind = 'spare_part' THEN v_amount := 20;
  ELSE RETURN jsonb_build_object('success', false, 'error', 'invalid_kind');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_not_found');
  END IF;
  IF v_balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance', 'required', v_amount, 'balance', v_balance);
  END IF;

  UPDATE public.wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, reference, description)
  VALUES (v_wallet_id, _user_id, 'listing_fee', v_amount, 'success', _ref_id::text, 'Listing fee: ' || _kind);

  RETURN jsonb_build_object('success', true, 'amount', v_amount);
END;
$$;

-- 2) Garage connects table
CREATE TABLE IF NOT EXISTS public.garage_connects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  garage_id uuid NOT NULL,
  mechanic_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  payout_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  paid_out_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.garage_connects TO authenticated;
GRANT ALL ON public.garage_connects TO service_role;

ALTER TABLE public.garage_connects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own connects" ON public.garage_connects FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = mechanic_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own connects" ON public.garage_connects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mechanic responds to connects" ON public.garage_connects FOR UPDATE TO authenticated
USING (auth.uid() = mechanic_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_garage_connects_user ON public.garage_connects(user_id);
CREATE INDEX IF NOT EXISTS idx_garage_connects_mechanic ON public.garage_connects(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_garage_connects_garage ON public.garage_connects(garage_id);

-- 3) Request connect RPC
CREATE OR REPLACE FUNCTION public.request_garage_connect(_garage_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_mechanic uuid;
  v_wallet uuid;
  v_balance numeric;
  v_amount numeric := 10;
  v_existing uuid;
  v_connect_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT owner_id INTO v_mechanic FROM public.garages WHERE id = _garage_id;
  IF v_mechanic IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'garage_not_found');
  END IF;
  IF v_mechanic = v_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'own_garage');
  END IF;

  -- Existing accepted or pending? return it
  SELECT id INTO v_existing FROM public.garage_connects
  WHERE user_id = v_user AND garage_id = _garage_id AND status IN ('pending','accepted')
  ORDER BY created_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'connect_id', v_existing, 'already', true);
  END IF;

  SELECT id, balance INTO v_wallet, v_balance FROM public.wallets WHERE user_id = v_user FOR UPDATE;
  IF v_wallet IS NULL OR v_balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance', 'required', v_amount, 'balance', COALESCE(v_balance,0));
  END IF;

  UPDATE public.wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_wallet;

  INSERT INTO public.garage_connects (user_id, garage_id, mechanic_id, amount)
  VALUES (v_user, _garage_id, v_mechanic, v_amount)
  RETURNING id INTO v_connect_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, reference, related_user_id, description)
  VALUES (v_wallet, v_user, 'connect_hold', v_amount, 'success', v_connect_id::text, v_mechanic, 'Connect request');

  RETURN jsonb_build_object('success', true, 'connect_id', v_connect_id);
END;
$$;

-- 4) Respond to connect RPC
CREATE OR REPLACE FUNCTION public.respond_garage_connect(_connect_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_connect record;
  v_buyer_wallet uuid;
BEGIN
  SELECT * INTO v_connect FROM public.garage_connects WHERE id = _connect_id FOR UPDATE;
  IF v_connect IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  IF v_connect.mechanic_id <> v_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF v_connect.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_responded');
  END IF;

  IF _accept THEN
    UPDATE public.garage_connects SET status = 'accepted', responded_at = now() WHERE id = _connect_id;
    RETURN jsonb_build_object('success', true, 'status', 'accepted');
  ELSE
    -- Refund buyer
    SELECT id INTO v_buyer_wallet FROM public.wallets WHERE user_id = v_connect.user_id FOR UPDATE;
    IF v_buyer_wallet IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + v_connect.amount, updated_at = now() WHERE id = v_buyer_wallet;
      INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, reference, related_user_id, description)
      VALUES (v_buyer_wallet, v_connect.user_id, 'connect_refund', v_connect.amount, 'success', _connect_id::text, v_user, 'Connect refund');
    END IF;
    UPDATE public.garage_connects SET status = 'rejected', responded_at = now(), payout_status = 'refunded' WHERE id = _connect_id;
    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;
END;
$$;

-- 5) Weekly payout aggregation
CREATE OR REPLACE FUNCTION public.process_weekly_connects()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_wallet uuid;
  v_total numeric := 0;
  v_count int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  FOR r IN
    SELECT mechanic_id, SUM(amount) AS total, array_agg(id) AS ids
    FROM public.garage_connects
    WHERE status = 'accepted' AND payout_status = 'pending'
      AND responded_at < (date_trunc('week', now()))
    GROUP BY mechanic_id
  LOOP
    SELECT id INTO v_wallet FROM public.wallets WHERE user_id = r.mechanic_id FOR UPDATE;
    IF v_wallet IS NULL THEN
      INSERT INTO public.wallets (user_id) VALUES (r.mechanic_id) RETURNING id INTO v_wallet;
    END IF;
    UPDATE public.wallets SET balance = balance + r.total, updated_at = now() WHERE id = v_wallet;
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, description)
    VALUES (v_wallet, r.mechanic_id, 'connect_payout', r.total, 'success', 'Weekly connect payout');
    UPDATE public.garage_connects SET payout_status = 'paid', paid_out_at = now() WHERE id = ANY(r.ids);
    v_total := v_total + r.total;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'mechanics_paid', v_count, 'total', v_total);
END;
$$;

-- 6) Process wallet payment with optional service fee (bps)
CREATE OR REPLACE FUNCTION public.process_wallet_payment(_buyer_id uuid, _seller_id uuid, _amount numeric, _order_id uuid, _description text DEFAULT NULL::text, _fee_bps integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_buyer_wallet uuid;
  v_seller_wallet uuid;
  v_balance numeric;
  v_fee numeric;
  v_seller_amount numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_must_be_positive');
  END IF;

  v_fee := ROUND((_amount * COALESCE(_fee_bps,0)::numeric) / 10000, 2);
  v_seller_amount := _amount - v_fee;

  SELECT id, balance INTO v_buyer_wallet, v_balance FROM public.wallets WHERE user_id = _buyer_id FOR UPDATE;
  IF v_buyer_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_not_found');
  END IF;
  IF v_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance', 'balance', v_balance);
  END IF;

  SELECT id INTO v_seller_wallet FROM public.wallets WHERE user_id = _seller_id FOR UPDATE;
  IF v_seller_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id) VALUES (_seller_id) RETURNING id INTO v_seller_wallet;
  END IF;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE id = v_buyer_wallet;
  UPDATE public.wallets SET balance = balance + v_seller_amount, updated_at = now() WHERE id = v_seller_wallet;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, related_order_id, related_user_id, description)
  VALUES (v_buyer_wallet, _buyer_id, 'payment', _amount, 'success', _order_id, _seller_id, COALESCE(_description, 'Payment'));

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, related_order_id, related_user_id, description)
  VALUES (v_seller_wallet, _seller_id, 'credit', v_seller_amount, 'success', _order_id, _buyer_id, COALESCE(_description, 'Sale') || ' (net of fee)');

  IF v_fee > 0 THEN
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, related_order_id, related_user_id, description)
    VALUES (v_seller_wallet, _seller_id, 'service_fee', v_fee, 'success', _order_id, _buyer_id, 'Platform service fee (3%)');
  END IF;

  RETURN jsonb_build_object('success', true, 'fee', v_fee, 'seller_received', v_seller_amount);
END;
$$;
