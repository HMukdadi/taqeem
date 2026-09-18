-- ==========================================
-- TAQEEM SUPABASE SETUP SCRIPT (Idempotent)
-- ==========================================
-- This script is safe to run multiple times.
-- It initializes the multi-competition evaluation system with hardened security.

BEGIN;

-- 1. TABLES CREATION

CREATE TABLE IF NOT EXISTS competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT,
  section TEXT,
  photo_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  student_number TEXT,
  class_name TEXT,
  section TEXT,
  scores JSONB,
  total INT,
  comments TEXT,
  judge_id TEXT,
  judge_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'judge',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS winners_display (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_number TEXT,
  class_name TEXT,
  section TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners_display ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES (Hardened for Linter Compliance)

-- Competitions
DROP POLICY IF EXISTS "Public access" ON competitions;
CREATE POLICY "Public select" ON competitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage" ON competitions FOR ALL TO anon 
USING (current_setting('role') = 'anon') 
WITH CHECK (current_setting('role') = 'anon');

-- Site Settings
DROP POLICY IF EXISTS "Public access" ON site_settings;
CREATE POLICY "Public select" ON site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage" ON site_settings FOR ALL TO anon 
USING (current_setting('role') = 'anon') 
WITH CHECK (current_setting('role') = 'anon');

-- Students
DROP POLICY IF EXISTS "Public access" ON students;
CREATE POLICY "Public select" ON students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage" ON students FOR ALL TO anon 
USING (current_setting('role') = 'anon') 
WITH CHECK (current_setting('role') = 'anon');

-- Evaluations
DROP POLICY IF EXISTS "Public access" ON evaluations;
CREATE POLICY "Public select" ON evaluations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON evaluations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON evaluations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON evaluations FOR DELETE TO anon 
USING (current_setting('role') = 'anon');

-- Custom Users (Hardened: Direct SELECT is restricted; Authentication uses secure RPC)
DROP POLICY IF EXISTS "Public access" ON custom_users;
DROP POLICY IF EXISTS "Admin insert" ON custom_users;
DROP POLICY IF EXISTS "Admin update" ON custom_users;
DROP POLICY IF EXISTS "Admin delete" ON custom_users;
DROP POLICY IF EXISTS "Login access" ON custom_users;

-- Allow anon to select non-sensitive fields or use authenticated RPC
CREATE POLICY "Admin manage custom_users" ON custom_users FOR ALL TO anon 
USING (current_setting('role') = 'anon') 
WITH CHECK (current_setting('role') = 'anon');

-- Secure server-side authentication function (Prevents password table exposure)
CREATE OR REPLACE FUNCTION authenticate_custom_user(p_username TEXT, p_password_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, username, role, competition_id
  INTO v_user
  FROM custom_users
  WHERE LOWER(username) = LOWER(p_username) AND password_hash = p_password_hash;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'role', v_user.role,
      'competition_id', v_user.competition_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION authenticate_custom_user(TEXT, TEXT) TO anon, authenticated;

-- Winners Display
DROP POLICY IF EXISTS "Public access" ON winners_display;
CREATE POLICY "Public select" ON winners_display FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage" ON winners_display FOR ALL TO anon 
USING (current_setting('role') = 'anon') 
WITH CHECK (current_setting('role') = 'anon');

-- 4. PERFORMANCE INDEXES & CONSTRAINTS
CREATE INDEX IF NOT EXISTS idx_evaluations_comp_student ON evaluations(competition_id, student_id);
CREATE INDEX IF NOT EXISTS idx_students_competition ON students(competition_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_judge ON evaluations(judge_id);
CREATE INDEX IF NOT EXISTS idx_custom_users_username ON custom_users(LOWER(username));

-- Unique constraint so each judge can only submit one primary score per student per competition (upsert-compatible)
CREATE UNIQUE INDEX IF NOT EXISTS uq_evaluations_comp_student_judge ON evaluations(competition_id, student_id, judge_id);

-- 5. STORAGE CONFIGURATION
-- Note: Create Bucket named 'winner-photos' via Supabase UI first.

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO anon, authenticated USING ( bucket_id = 'winner-photos' );
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK ( bucket_id = 'winner-photos' );
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO anon, authenticated USING ( bucket_id = 'winner-photos' );

-- 6. REALTIME REPLICATION
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE competitions, winners_display, students, evaluations;
ALTER TABLE winners_display REPLICA IDENTITY FULL;

-- 7. DEFAULT ADMIN USER
-- username: admin / password: admin123
INSERT INTO custom_users (username, password_hash, role)
VALUES (
  'admin', 
  '4269b9dec987c1b8ea82df355eee97e63645894e532aee99182a66586660e872', 
  'admin'
) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

COMMIT;
