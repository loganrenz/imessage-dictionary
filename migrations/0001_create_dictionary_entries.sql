-- Create dictionary entries table
CREATE TABLE IF NOT EXISTS dictionary_entries (
  term TEXT PRIMARY KEY,
  pos TEXT,
  gloss TEXT NOT NULL,
  example TEXT,
  source TEXT,
  source_url TEXT,
  license TEXT,
  updated_at TEXT,
  -- JSON array of all senses stored as TEXT
  senses_json TEXT NOT NULL
);

-- Index for prefix search (SQLite can use this for LIKE queries)
CREATE INDEX IF NOT EXISTS idx_term_prefix ON dictionary_entries(term);

-- Full-text search index (optional, for advanced search)
-- Note: SQLite FTS5 requires different table structure
-- We'll use LIKE queries with index instead for simplicity
