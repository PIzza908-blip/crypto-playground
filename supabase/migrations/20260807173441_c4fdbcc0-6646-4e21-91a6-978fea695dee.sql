
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  tg_id bigint,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.balances (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset text NOT NULL,
  amount numeric(30,10) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, asset)
);
GRANT SELECT ON public.balances TO authenticated;
GRANT ALL ON public.balances TO service_role;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balances read" ON public.balances FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  asset text NOT NULL,
  amount numeric(30,10) NOT NULL,
  counterparty text,
  status text NOT NULL DEFAULT 'done',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_idx ON public.transactions (user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset text NOT NULL,
  amount numeric(30,10) NOT NULL,
  comment text,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checks TO authenticated;
GRANT ALL ON public.checks TO service_role;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checks read" ON public.checks FOR SELECT TO authenticated USING (auth.uid() = creator_id OR auth.uid() = claimed_by);

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset text NOT NULL,
  amount numeric(30,10) NOT NULL,
  usd_value numeric(20,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'card',
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.prices (
  asset text PRIMARY KEY,
  name text NOT NULL,
  usd numeric(20,6) NOT NULL,
  change_24h numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prices TO authenticated;
GRANT SELECT ON public.prices TO anon;
GRANT ALL ON public.prices TO service_role;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prices public read" ON public.prices FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.prices (asset, name, usd, change_24h) VALUES
  ('BTC','Bitcoin', 96500, 1.24),
  ('ETH','Ethereum', 3320, 2.10),
  ('TON','Toncoin', 5.42, -0.85),
  ('USDT','Tether', 1.00, 0.01),
  ('NOT','Notcoin', 0.0089, 3.40),
  ('SOL','Solana', 198.5, 1.90),
  ('DOGS','Dogs', 0.00075, -1.20),
  ('TRX','TRON', 0.242, 0.55),
  ('DOGE','Dogecoin', 0.335, 2.70),
  ('BNB','BNB', 712, 0.90);

CREATE OR REPLACE FUNCTION public.bootstrap_profile(p_username text, p_tg_id bigint DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_profile public.profiles; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF FOUND THEN RETURN v_profile; END IF;
  INSERT INTO public.profiles (id, username, tg_id, is_admin)
  VALUES (v_uid, p_username, p_tg_id, lower(p_username) = 'zynxmedia')
  RETURNING * INTO v_profile;
  INSERT INTO public.balances (user_id, asset, amount) VALUES (v_uid, 'USDT', 25);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, note)
  VALUES (v_uid, 'bonus', 'USDT', 25, 'Koronka', 'Стартовый бонус');
  RETURN v_profile;
END; $$;

CREATE OR REPLACE FUNCTION public.add_balance(p_user uuid, p_asset text, p_delta numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_new numeric;
BEGIN
  INSERT INTO public.balances (user_id, asset, amount) VALUES (p_user, p_asset, 0)
  ON CONFLICT (user_id, asset) DO NOTHING;
  UPDATE public.balances SET amount = amount + p_delta
  WHERE user_id = p_user AND asset = p_asset RETURNING amount INTO v_new;
  IF v_new < 0 THEN RAISE EXCEPTION 'Недостаточно средств'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.add_balance(uuid, text, numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.transfer_to_user(p_username text, p_asset text, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_to uuid; v_from_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Некорректная сумма'; END IF;
  SELECT id INTO v_to FROM public.profiles WHERE lower(username) = lower(trim(both '@' from p_username));
  IF v_to IS NULL THEN RAISE EXCEPTION 'Пользователь не найден'; END IF;
  IF v_to = v_uid THEN RAISE EXCEPTION 'Нельзя отправить самому себе'; END IF;
  SELECT username INTO v_from_name FROM public.profiles WHERE id = v_uid;
  PERFORM public.add_balance(v_uid, p_asset, -p_amount);
  PERFORM public.add_balance(v_to, p_asset, p_amount);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty)
  VALUES (v_uid, 'send', p_asset, -p_amount, p_username),
         (v_to, 'receive', p_asset, p_amount, v_from_name);
END; $$;

CREATE OR REPLACE FUNCTION public.create_check(p_asset text, p_amount numeric, p_comment text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_code text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Некорректная сумма'; END IF;
  v_code := replace(encode(gen_random_bytes(9), 'base64'), '/', '_');
  v_code := replace(v_code, '+', '-');
  PERFORM public.add_balance(v_uid, p_asset, -p_amount);
  INSERT INTO public.checks (code, creator_id, asset, amount, comment)
  VALUES (v_code, v_uid, p_asset, p_amount, p_comment);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, note)
  VALUES (v_uid, 'check_out', p_asset, -p_amount, 'Чек', p_comment);
  RETURN v_code;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_check(p_code text)
RETURNS public.checks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_check public.checks; v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_check FROM public.checks WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Чек не найден'; END IF;
  IF v_check.claimed_by IS NOT NULL THEN RAISE EXCEPTION 'Чек уже активирован'; END IF;
  SELECT username INTO v_name FROM public.profiles WHERE id = v_check.creator_id;
  UPDATE public.checks SET claimed_by = v_uid, claimed_at = now() WHERE id = v_check.id RETURNING * INTO v_check;
  PERFORM public.add_balance(v_uid, v_check.asset, v_check.amount);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, note)
  VALUES (v_uid, 'check_in', v_check.asset, v_check.amount, v_name, 'Активация чека');
  RETURN v_check;
END; $$;

CREATE OR REPLACE FUNCTION public.swap_assets(p_from text, p_to text, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_from_usd numeric; v_to_usd numeric; v_out numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_from = p_to THEN RAISE EXCEPTION 'Выберите разные монеты'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Некорректная сумма'; END IF;
  SELECT usd INTO v_from_usd FROM public.prices WHERE asset = p_from;
  SELECT usd INTO v_to_usd FROM public.prices WHERE asset = p_to;
  IF v_from_usd IS NULL OR v_to_usd IS NULL THEN RAISE EXCEPTION 'Монета недоступна'; END IF;
  v_out := round(p_amount * v_from_usd / v_to_usd * 0.995, 10);
  PERFORM public.add_balance(v_uid, p_from, -p_amount);
  PERFORM public.add_balance(v_uid, p_to, v_out);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, note)
  VALUES (v_uid, 'swap_out', p_from, -p_amount, p_to, 'Обмен'),
         (v_uid, 'swap_in', p_to, v_out, p_from, 'Обмен');
  RETURN v_out;
END; $$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_asset text, p_amount numeric, p_method text, p_destination text)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_usd numeric; v_row public.withdrawals;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Некорректная сумма'; END IF;
  SELECT usd INTO v_usd FROM public.prices WHERE asset = p_asset;
  PERFORM public.add_balance(v_uid, p_asset, -p_amount);
  INSERT INTO public.withdrawals (user_id, asset, amount, usd_value, method, destination)
  VALUES (v_uid, p_asset, p_amount, round(p_amount * coalesce(v_usd,0), 2), p_method, p_destination)
  RETURNING * INTO v_row;
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, status, note)
  VALUES (v_uid, 'withdraw', p_asset, -p_amount, p_method, 'processing', 'Платёжная система обрабатывает платёж');
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_balance(p_username text, p_asset text, p_delta numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_is_admin boolean; v_target uuid;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_uid;
  IF NOT coalesce(v_is_admin, false) THEN RAISE EXCEPTION 'Нет доступа'; END IF;
  SELECT id INTO v_target FROM public.profiles WHERE lower(username) = lower(trim(both '@' from p_username));
  IF v_target IS NULL THEN RAISE EXCEPTION 'Пользователь не найден'; END IF;
  PERFORM public.add_balance(v_target, p_asset, p_delta);
  INSERT INTO public.transactions (user_id, kind, asset, amount, counterparty, note)
  VALUES (v_target, CASE WHEN p_delta >= 0 THEN 'deposit' ELSE 'correction' END, p_asset, p_delta, 'Koronka', 'Начисление администратором');
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (username text, tg_id bigint, created_at timestamptz, usd_total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT coalesce(v_is_admin, false) THEN RAISE EXCEPTION 'Нет доступа'; END IF;
  RETURN QUERY
  SELECT p.username, p.tg_id, p.created_at,
    coalesce((SELECT sum(b.amount * pr.usd) FROM public.balances b JOIN public.prices pr ON pr.asset = b.asset WHERE b.user_id = p.id), 0)::numeric
  FROM public.profiles p ORDER BY p.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.username_exists(p_username text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(both '@' from p_username))) $$;
GRANT EXECUTE ON FUNCTION public.username_exists(text) TO anon, authenticated;
