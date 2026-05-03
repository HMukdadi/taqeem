-- SQL Specification for Central Taqeem Metrics
-- Run this in your central Supabase project to enable real-time counters

-- 1. Create the Metrics Table
CREATE TABLE IF NOT EXISTS global_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT UNIQUE NOT NULL,
    value BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed Initial Values (if empty)
INSERT INTO global_metrics (metric_name, value)
VALUES 
    ('app_builds', 150),
    ('total_evals', 50000)
ON CONFLICT (metric_name) DO NOTHING;

-- 3. Create Increment Function
-- This allows the front-end to safely increment values without exposing full write access
CREATE OR REPLACE FUNCTION increment_metric(m_name TEXT)
RETURNS void AS $$
BEGIN
    UPDATE global_metrics
    SET value = value + 1,
        updated_at = timezone('utc'::text, now())
    WHERE metric_name = m_name;
END;
$$ LANGUAGE plpgsql;

-- 4. Set Permissions (Row Level Security)
-- Allow anyone to read the metrics
ALTER TABLE global_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to metrics"
ON global_metrics FOR SELECT
TO public
USING (true);

-- Allow everyone to execute the increment function (RPC)
-- Security Note: This allows public incrementing of specific counters.
GRANT EXECUTE ON FUNCTION increment_metric(TEXT) TO public;
GRANT EXECUTE ON FUNCTION increment_metric(TEXT) TO anon;
