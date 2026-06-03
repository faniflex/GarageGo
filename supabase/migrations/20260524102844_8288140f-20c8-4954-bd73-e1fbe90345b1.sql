
-- =========================
-- WALLETS
-- =========================
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'ETB',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallets" ON public.wallets
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- WALLET TRANSACTIONS
-- =========================
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit','payment','refund','payout','credit','debit')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('pending','success','failed')),
  reference text,
  related_order_id uuid,
  related_user_id uuid,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_tx_reference ON public.wallet_transactions(reference);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.wallet_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- PAYOUT REQUESTS
-- =========================
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payouts" ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own payouts" ON public.payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all payouts" ON public.payout_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update payouts" ON public.payout_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- GARAGE SERVICES (with price)
-- =========================
CREATE TABLE public.garage_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_garage_services_garage ON public.garage_services(garage_id);
ALTER TABLE public.garage_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views garage services" ON public.garage_services
  FOR SELECT USING (true);
CREATE POLICY "Owners insert services" ON public.garage_services
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.garages WHERE id = garage_id AND owner_id = auth.uid()));
CREATE POLICY "Owners update services" ON public.garage_services
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.garages WHERE id = garage_id AND owner_id = auth.uid()));
CREATE POLICY "Owners delete services" ON public.garage_services
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.garages WHERE id = garage_id AND owner_id = auth.uid()));

-- =========================
-- PART ORDERS
-- =========================
CREATE TABLE public.part_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  spare_part_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','completed','cancelled')),
  payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  conversation_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.part_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own part orders" ON public.part_orders
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers view own part orders" ON public.part_orders
  FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Admins view all part orders" ON public.part_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyers insert part orders" ON public.part_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers update part orders" ON public.part_orders
  FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can cancel part orders" ON public.part_orders
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE TRIGGER update_part_orders_updated_at
  BEFORE UPDATE ON public.part_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- ORDERS: add price + payment status
-- =========================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('unpaid','paid','refunded'));

-- =========================
-- AUTO-CREATE WALLET ON SIGNUP
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'car_owner'));

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Backfill wallets for any existing users
INSERT INTO public.wallets (user_id)
SELECT user_id FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.wallets);

-- =========================
-- MONEY MOVEMENT FUNCTIONS
-- =========================
CREATE OR REPLACE FUNCTION public.credit_wallet(
  _user_id uuid,
  _amount numeric,
  _reference text,
  _type text DEFAULT 'deposit',
  _description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_must_be_positive');
  END IF;

  -- idempotency: same reference + type means already credited
  IF _reference IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE reference = _reference AND type = _type AND status = 'success'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_credited', true);
  END IF;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id) VALUES (_user_id) RETURNING id INTO v_wallet_id;
  END IF;

  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, reference, description)
  VALUES (v_wallet_id, _user_id, _type, _amount, 'success', _reference, _description);

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_wallet_payment(
  _buyer_id uuid,
  _seller_id uuid,
  _amount numeric,
  _order_id uuid,
  _description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_buyer_wallet uuid;
  v_seller_wallet uuid;
  v_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_must_be_positive');
  END IF;

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
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE id = v_seller_wallet;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, related_order_id, related_user_id, description)
  VALUES (v_buyer_wallet, _buyer_id, 'payment', _amount, 'success', _order_id, _seller_id, COALESCE(_description, 'Payment'));

  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, related_order_id, related_user_id, description)
  VALUES (v_seller_wallet, _seller_id, 'credit', _amount, 'success', _order_id, _buyer_id, COALESCE(_description, 'Sale'));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payout(
  _payout_id uuid,
  _new_status text,
  _admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payout record;
  v_wallet_id uuid;
  v_balance numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF _new_status NOT IN ('approved','rejected','paid') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  SELECT * INTO v_payout FROM public.payout_requests WHERE id = _payout_id FOR UPDATE;
  IF v_payout IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- When approving, debit the wallet (once)
  IF _new_status = 'approved' AND v_payout.status = 'pending' THEN
    SELECT id, balance INTO v_wallet_id, v_balance FROM public.wallets WHERE user_id = v_payout.user_id FOR UPDATE;
    IF v_balance < v_payout.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
    END IF;
    UPDATE public.wallets SET balance = balance - v_payout.amount, updated_at = now() WHERE id = v_wallet_id;
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, status, reference, description)
    VALUES (v_wallet_id, v_payout.user_id, 'payout', v_payout.amount, 'success', _payout_id::text, 'Payout approved');
  END IF;

  UPDATE public.payout_requests
  SET status = _new_status, admin_note = COALESCE(_admin_note, admin_note), updated_at = now()
  WHERE id = _payout_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
