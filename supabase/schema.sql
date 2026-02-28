-- CourtCheck Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/ttkizntlwtloijwoaska/sql)

-- ============================================================
-- check_ins: tracks who is currently at each court
-- ============================================================
CREATE TABLE IF NOT EXISTS check_ins (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id        INTEGER     NOT NULL,
  player_name     TEXT        NOT NULL DEFAULT 'Anonymous',
  duration        TEXT        DEFAULT '2',
  checked_in_at   TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at  TIMESTAMPTZ,
  is_active       BOOLEAN     DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS check_ins_active ON check_ins (court_id, is_active, checked_in_at);

-- ============================================================
-- broadcasts: "Need Players" posts
-- ============================================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id       INTEGER,
  court_name     TEXT        NOT NULL,
  player_name    TEXT        NOT NULL,
  message        TEXT        NOT NULL,
  players_needed TEXT        DEFAULT '2',
  skill_level    TEXT        DEFAULT 'Any level',
  run_type       TEXT        DEFAULT 'Full Court 5v5',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  is_active      BOOLEAN     DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS broadcasts_active ON broadcasts (is_active, created_at);

-- ============================================================
-- Row Level Security (allow public read/write via anon key)
-- ============================================================
ALTER TABLE check_ins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Check-ins policies
CREATE POLICY "anon select check_ins"  ON check_ins FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert check_ins"  ON check_ins FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update check_ins"  ON check_ins FOR UPDATE TO anon USING (true);

-- Broadcasts policies
CREATE POLICY "anon select broadcasts" ON broadcasts FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert broadcasts" ON broadcasts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update broadcasts" ON broadcasts FOR UPDATE TO anon USING (true);

-- ============================================================
-- Enable Realtime (run these separately if the tables already exist)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
