-- ============================================================
-- Transfera — Complete Database Migration
-- Run this ENTIRE file as ONE query in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Create all tables (in dependency order)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  currency VARCHAR(3) DEFAULT 'USD',
  kyc_status VARCHAR(20) DEFAULT 'unverified' CHECK (kyc_status IN ('unverified','pending','verified','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  account_number VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_account_id UUID NOT NULL REFERENCES accounts(id),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('internal','external_bank','mobile_wallet','cash_pickup')),
  recipient_account_id UUID REFERENCES accounts(id),
  recipient_name VARCHAR(200) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_bank_name VARCHAR(100),
  recipient_account_number VARCHAR(50),
  recipient_routing_number VARCHAR(50),
  recipient_country VARCHAR(2) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  fee DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  exchange_rate DECIMAL(19,8),
  converted_amount DECIMAL(19,4),
  currency VARCHAR(3) NOT NULL,
  recipient_currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','failed')),
  description VARCHAR(255),
  reference_code VARCHAR(20) NOT NULL UNIQUE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason VARCHAR(255),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit','fee')),
  amount DECIMAL(19,4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  balance_after DECIMAL(19,4) NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supported_countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  currency_name VARCHAR(50) NOT NULL,
  flag_emoji VARCHAR(8) NOT NULL,
  delivery_methods VARCHAR[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(19,8) NOT NULL,
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- ============================================================
-- STEP 2: Enable Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Create functions BEFORE triggers
-- ============================================================

-- Function 1: Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1),
    SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 2)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Auto-create account with generated number
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_account_number VARCHAR(20);
  attempts INT := 0;
BEGIN
  LOOP
    new_account_number := 'TR' || LPAD(FLOOR(RANDOM() * 99999999)::TEXT, 8, '0');
    attempts := attempts + 1;
    EXIT WHEN attempts > 10;
    BEGIN
      INSERT INTO public.accounts (user_id, currency, account_number)
      VALUES (NEW.id, COALESCE(NEW.currency, 'USD'), new_account_number);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Auto-generate reference code
CREATE OR REPLACE FUNCTION public.generate_reference_code()
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'TXN-';
  i INT;
BEGIN
  result := result || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  FOR i IN 1..4 LOOP
    result := result || SUBSTR(chars, FLOOR(1 + RANDOM() * 36)::INT, 1);
  END LOOP;
  NEW.reference_code := result;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 4: The CORE transfer approval workflow
CREATE OR REPLACE FUNCTION public.handle_transfer_approved()
RETURNS TRIGGER AS $$
DECLARE
  sender_balance DECIMAL(19,4);
BEGIN
  -- Only run when status changes from 'pending' to 'approved'
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    
    -- Get sender's current balance
    SELECT balance INTO sender_balance FROM accounts WHERE id = NEW.sender_account_id;
    
    -- Check sufficient balance
    IF sender_balance < NEW.amount + NEW.fee THEN
      NEW.status := 'failed';
      NEW.rejection_reason := 'Insufficient balance';
      NEW.updated_at := NOW();
      RETURN NEW;
    END IF;
    
    -- Deduct from sender's account
    UPDATE accounts 
    SET balance = balance - NEW.amount - NEW.fee,
        updated_at = NOW()
    WHERE id = NEW.sender_account_id;
    
    -- Credit recipient's account (only for internal transfers)
    IF NEW.recipient_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance + COALESCE(NEW.converted_amount, NEW.amount),
          updated_at = NOW()
      WHERE id = NEW.recipient_account_id;
    END IF;
    
    -- Create debit transaction for sender (immutable ledger record)
    INSERT INTO transactions (
      account_id, transfer_id, type, amount, currency, 
      balance_after, description, reference_code
    ) VALUES (
      NEW.sender_account_id,
      NEW.id,
      'debit',
      NEW.amount + NEW.fee,
      NEW.currency,
      sender_balance - NEW.amount - NEW.fee,
      'Transfer to ' || NEW.recipient_name,
      NEW.reference_code
    );
    
    -- Create credit transaction for recipient (if internal)
    IF NEW.recipient_account_id IS NOT NULL THEN
      INSERT INTO transactions (
        account_id, transfer_id, type, amount, currency,
        balance_after, description, reference_code
      ) VALUES (
        NEW.recipient_account_id,
        NEW.id,
        'credit',
        COALESCE(NEW.converted_amount, NEW.amount),
        NEW.recipient_currency,
        (SELECT balance FROM accounts WHERE id = NEW.recipient_account_id),
        'Transfer from account ' || NEW.sender_account_id,
        NEW.reference_code
      );
    END IF;
    
    -- Mark transfer as completed
    NEW.status := 'completed';
    NEW.completed_at := NOW();
    NEW.updated_at := NOW();
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 4: Create triggers
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE TRIGGER set_reference_code
  BEFORE INSERT ON transfers
  FOR EACH ROW EXECUTE FUNCTION public.generate_reference_code();

CREATE TRIGGER transfer_approved_trigger
  BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_approved();

-- ============================================================
-- STEP 5: Create RLS policies
-- ============================================================

-- profiles: users can only see/update their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- accounts: users can only see their own account
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = accounts.user_id AND profiles.id = auth.uid()
  ));

-- transfers: users can only see/create transfers they sent
CREATE POLICY transfers_select ON transfers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = transfers.sender_account_id AND accounts.user_id = auth.uid()
  ));

CREATE POLICY transfers_insert ON transfers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = transfers.sender_account_id AND accounts.user_id = auth.uid()
  ));

-- transactions: users can only see their own transactions
CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid()
  ));

-- supported_countries: public read access
CREATE POLICY countries_select ON supported_countries FOR SELECT USING (true);

-- exchange_rates: public read access
CREATE POLICY rates_select ON exchange_rates FOR SELECT USING (true);

-- ============================================================
-- STEP 6: Seed reference data
-- ============================================================

INSERT INTO supported_countries (code, name, currency_code, currency_name, flag_emoji, delivery_methods) VALUES
('US', 'United States', 'USD', 'US Dollar', '🇺🇸', ARRAY['bank_deposit', 'card_transfer']),
('GB', 'United Kingdom', 'GBP', 'British Pound', '🇬🇧', ARRAY['bank_deposit', 'mobile_wallet']),
('EU', 'European Union', 'EUR', 'Euro', '🇪🇺', ARRAY['bank_deposit', 'mobile_wallet']),
('NG', 'Nigeria', 'NGN', 'Nigerian Naira', '🇳🇬', ARRAY['bank_deposit', 'mobile_wallet', 'cash_pickup']),
('IN', 'India', 'INR', 'Indian Rupee', '🇮🇳', ARRAY['bank_deposit', 'mobile_wallet']),
('BR', 'Brazil', 'BRL', 'Brazilian Real', '🇧🇷', ARRAY['bank_deposit']),
('GH', 'Ghana', 'GHS', 'Ghana Cedi', '🇬🇭', ARRAY['mobile_wallet', 'cash_pickup']),
('KE', 'Kenya', 'KES', 'Kenyan Shilling', '🇰🇪', ARRAY['mobile_wallet', 'cash_pickup']),
('PH', 'Philippines', 'PHP', 'Philippine Peso', '🇵🇭', ARRAY['bank_deposit', 'mobile_wallet', 'cash_pickup']),
('MX', 'Mexico', 'MXN', 'Mexican Peso', '🇲🇽', ARRAY['bank_deposit', 'cash_pickup']),
('ZA', 'South Africa', 'ZAR', 'South African Rand', '🇿🇦', ARRAY['bank_deposit', 'mobile_wallet']),
('AU', 'Australia', 'AUD', 'Australian Dollar', '🇦🇺', ARRAY['bank_deposit']),
('CA', 'Canada', 'CAD', 'Canadian Dollar', '🇨🇦', ARRAY['bank_deposit', 'mobile_wallet']),
('JP', 'Japan', 'JPY', 'Japanese Yen', '🇯🇵', ARRAY['bank_deposit']),
('SG', 'Singapore', 'SGD', 'Singapore Dollar', '🇸🇬', ARRAY['bank_deposit', 'mobile_wallet'])
ON CONFLICT (code) DO NOTHING;

INSERT INTO exchange_rates (from_currency, to_currency, rate, fee_percentage) VALUES
('USD', 'EUR', 0.92000000, 0.50),
('USD', 'GBP', 0.79000000, 0.50),
('USD', 'NGN', 1530.00000000, 1.00),
('USD', 'INR', 83.50000000, 0.75),
('USD', 'BRL', 5.65000000, 1.00),
('USD', 'GHS', 15.20000000, 1.00),
('USD', 'KES', 142.00000000, 1.00),
('USD', 'PHP', 56.80000000, 0.75),
('USD', 'MXN', 18.50000000, 1.00),
('USD', 'ZAR', 18.80000000, 1.00),
('USD', 'AUD', 1.52000000, 0.50),
('USD', 'CAD', 1.36000000, 0.50),
('USD', 'JPY', 149.00000000, 0.75),
('USD', 'SGD', 1.34000000, 0.50),
('EUR', 'USD', 1.08700000, 0.50),
('GBP', 'USD', 1.26500000, 0.50)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- ============================================================
-- STEP 7: Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'transfers', COUNT(*) FROM transfers
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'supported_countries', COUNT(*) FROM supported_countries
UNION ALL
SELECT 'exchange_rates', COUNT(*) FROM exchange_rates;
