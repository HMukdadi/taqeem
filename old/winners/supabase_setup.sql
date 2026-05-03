-- ===== WINNERS DISPLAY TABLE =====
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create the winners_display table
CREATE TABLE IF NOT EXISTS winners_display (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_number TEXT,
  class_name TEXT,
  section TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE winners_display ENABLE ROW LEVEL SECURITY;

-- 3. Allow all authenticated and anonymous users to read (the display screen is public)
DROP POLICY IF EXISTS "Allow public read" ON winners_display;
CREATE POLICY "Allow public read" ON winners_display
  FOR SELECT USING (true);

-- 4. Allow inserts (admin panel pushes winners)
DROP POLICY IF EXISTS "Allow insert" ON winners_display;
CREATE POLICY "Allow insert" ON winners_display
  FOR INSERT WITH CHECK (true);

-- 5. Allow updates (admin deactivates old winners)
DROP POLICY IF EXISTS "Allow update" ON winners_display;
CREATE POLICY "Allow update" ON winners_display
  FOR UPDATE USING (true);

-- 6. Allow deletes (optional cleanup)
DROP POLICY IF EXISTS "Allow delete" ON winners_display;
CREATE POLICY "Allow delete" ON winners_display
  FOR DELETE USING (true);

-- 7. Enable Realtime on this table
-- Go to Supabase Dashboard > Database > Replication
-- Enable the "winners_display" table for Realtime
-- (Handled by the robust block at the end of this script)
-- ALTER PUBLICATION supabase_realtime ADD TABLE winners_display;

-- 8. STORAGE BUCKET POLICIES (for winner-photos bucket)
-- Run this to allow the admin panel to upload photos and public users to see them

-- Allow anyone to view photos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'winner-photos' );

-- Allow anonymous users to upload photos
DROP POLICY IF EXISTS "Anonymous Uploads" ON storage.objects;
CREATE POLICY "Anonymous Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'winner-photos' );

-- Allow anonymous users to update photos (important for pushing the same student twice)
DROP POLICY IF EXISTS "Anonymous Updates" ON storage.objects;
CREATE POLICY "Anonymous Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'winner-photos' );

-- 9. (Optional) FORCE REBUILD REALTIME PUBLICATION
-- If Realtime is still not working, run this:
-- BEGIN;
--   DROP PUBLICATION IF EXISTS supabase_realtime;
--   CREATE PUBLICATION supabase_realtime FOR TABLE winners_display, evaluations, students;
-- COMMIT;

-- ===== ADDITIONAL TABLES SETUP =====
-- Run these if they don't exist yet

-- 10. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT,
  section TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Students" ON students;
CREATE POLICY "Public Read Students" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Students" ON students;
CREATE POLICY "Public Insert Students" ON students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Students" ON students;
CREATE POLICY "Public Update Students" ON students FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Students" ON students;
CREATE POLICY "Public Delete Students" ON students FOR DELETE USING (true);

-- 11. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Evaluations" ON evaluations;
CREATE POLICY "Public Read Evaluations" ON evaluations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Evaluations" ON evaluations;
CREATE POLICY "Public Insert Evaluations" ON evaluations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Evaluations" ON evaluations;
CREATE POLICY "Public Update Evaluations" ON evaluations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Evaluations" ON evaluations;
CREATE POLICY "Public Delete Evaluations" ON evaluations FOR DELETE USING (true);

-- =========== FINAL REALTIME FIX (RUN THIS!) ===========
-- This is the "Nuclear" option that resets everything. 
-- It is the most reliable way to fix Realtime connectivity issues.

BEGIN;
  -- 1. Drop the existing publication
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- 2. Create the publication for all relevant tables
  CREATE PUBLICATION supabase_realtime FOR TABLE winners_display, students, evaluations;
  
  -- 3. Set REPLICA IDENTITY FULL
  -- This ensures that when a row changes, the full data is broadcasted
  ALTER TABLE winners_display REPLICA IDENTITY FULL;
COMMIT;

-- Verification query (optional - run to check status):
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';



