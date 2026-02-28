-- Court Check Chat Migration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name  TEXT        NOT NULL DEFAULT 'Anonymous',
  court_id     INTEGER,
  court_name   TEXT,
  message      TEXT        NOT NULL,
  chat_type    TEXT        NOT NULL DEFAULT 'global', -- 'global' | 'court'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_global  ON chat_messages (chat_type, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_court   ON chat_messages (court_id, chat_type, created_at);

-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon select chat"  ON chat_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert chat"  ON chat_messages FOR INSERT TO anon WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
