CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_normalized CHECK (email = lower(email))
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  requested_ip text,
  attempts smallint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT login_codes_attempts_nonnegative CHECK (attempts >= 0)
);
CREATE INDEX IF NOT EXISTS login_codes_user_created_idx
  ON login_codes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS login_codes_expires_at_idx ON login_codes(expires_at);

CREATE TABLE IF NOT EXISTS resume_libraries (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  library jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resume_libraries_version_positive CHECK (version > 0),
  CONSTRAINT resume_libraries_library_object CHECK (jsonb_typeof(library) = 'object')
);

-- Unified email authentication: codes can exist before a user is created.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE login_codes ADD COLUMN IF NOT EXISTS email text;
UPDATE login_codes SET email = users.email FROM users
 WHERE login_codes.user_id = users.id AND login_codes.email IS NULL;
ALTER TABLE login_codes ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS login_codes_email_created_idx
 ON login_codes(email, created_at DESC);

-- Google identities use the provider's stable subject, never the mutable email, as their key.
CREATE TABLE IF NOT EXISTS google_accounts (
  google_subject text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS google_accounts_user_idx ON google_accounts(user_id);

CREATE TABLE IF NOT EXISTS google_login_requests (
  state_hash char(64) PRIMARY KEY,
  browser_hash char(64) NOT NULL,
  code_verifier text NOT NULL,
  nonce text NOT NULL,
  next_path text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS google_login_requests_expiry_idx ON google_login_requests(expires_at);

CREATE TABLE IF NOT EXISTS google_email_links (
  token_hash char(64) PRIMARY KEY,
  google_subject text NOT NULL,
  email text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS google_email_links_expiry_idx ON google_email_links(expires_at);

CREATE TABLE IF NOT EXISTS online_resumes (
  slug text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id text NOT NULL,
  title text NOT NULL,
  resume_data jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT online_resumes_user_doc_unique UNIQUE (user_id, document_id)
);
CREATE INDEX IF NOT EXISTS online_resumes_user_id_idx ON online_resumes(user_id);

CREATE TABLE IF NOT EXISTS online_resume_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL REFERENCES online_resumes(slug) ON DELETE CASCADE,
  source_tag text NOT NULL DEFAULT '',
  device_label text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  downloaded_pdf boolean NOT NULL DEFAULT false,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS online_resume_views_slug_viewed_idx
  ON online_resume_views(slug, viewed_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_plan text NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS redemption_codes (
  code text PRIMARY KEY,
  plan_type text NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  batch_note text NOT NULL DEFAULT '',
  redeemed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS redemption_codes_redeemed_by_idx
  ON redemption_codes(redeemed_by);

CREATE TABLE IF NOT EXISTS membership_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  amount_cents integer NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'redemption_code',
  pay_method text NOT NULL DEFAULT 'redemption_code',
  status text NOT NULL DEFAULT 'paid',
  qr_url text NOT NULL DEFAULT '',
  external_ref text NOT NULL DEFAULT '',
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS order_no text UNIQUE;
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS pay_method text NOT NULL DEFAULT 'redemption_code';
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'paid';
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS qr_url text NOT NULL DEFAULT '';
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS membership_orders_user_id_idx
  ON membership_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS membership_orders_order_no_idx
  ON membership_orders(order_no);

INSERT INTO redemption_codes (code, plan_type, duration_days, batch_note)
VALUES
  ('ROK-M30-DEMO-8888', 'monthly', 30, '系统内置测试月卡兑换码'),
  ('ROK-Q90-DEMO-8888', 'quarterly', 90, '系统内置测试季卡兑换码'),
  ('ROK-Y365-DEMO-8888', 'yearly', 365, '系统内置测试年卡兑换码')
ON CONFLICT (code) DO NOTHING;
