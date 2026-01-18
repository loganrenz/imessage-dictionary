-- Additional index for case-insensitive search
-- SQLite doesn't support case-insensitive indexes directly,
-- but we can use COLLATE NOCASE in queries
-- This index helps with prefix searches

-- For full-text search, we can use LIKE with term index
-- More efficient searches will use the primary key index for exact lookups
