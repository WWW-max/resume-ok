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
