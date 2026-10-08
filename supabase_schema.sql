-- ==========================================
-- SlamSpace Supabase SQL Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ==========================================

-- Rooms table (optional for multi-room support)
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'My Slam Book',
  owner TEXT NOT NULL DEFAULT 'anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rooms (id, name, owner) VALUES ('default', 'SlamSpace', 'owner')
ON CONFLICT (id) DO NOTHING;

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE DEFAULT 'default',
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  friendship_level INTEGER DEFAULT 10 CHECK (friendship_level BETWEEN 1 AND 10),
  fav_color TEXT DEFAULT '#e4ba77',
  avatar_url TEXT,
  signature_data TEXT,
  theme TEXT DEFAULT 'nostalgia' CHECK (theme IN ('nostalgia', 'bollywood', 'kpop')),
  unlock_at TIMESTAMPTZ,
  ai_poem TEXT,
  ai_compatibility INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE DEFAULT 'default',
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (adjust for production auth)
CREATE POLICY "Allow public read on entries" ON entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert on entries" ON entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on memories" ON memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on memories" ON memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on rooms" ON rooms FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS entries_room_created ON entries (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS memories_room_created ON memories (room_id, created_at ASC);

-- Storage bucket for avatars (run in Supabase Dashboard > Storage)
-- Create a bucket named "slam-media" and set it to PUBLIC
