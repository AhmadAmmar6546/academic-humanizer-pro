-- Apply once per database with `node scripts/setup-database.mjs`.
-- Times use epoch milliseconds, matching the API's existing retention logic.
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  title TEXT NOT NULL,
  payload TEXT NOT NULL,
  created BIGINT NOT NULL,
  expires BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS revisions_owner_created_idx
  ON revisions (owner, created DESC);
CREATE INDEX IF NOT EXISTS revisions_expires_idx ON revisions (expires);

CREATE TABLE IF NOT EXISTS limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS limits_expires_idx ON limits (expires);
