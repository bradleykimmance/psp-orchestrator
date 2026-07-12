-- One row per payment attempt, keyed by the client-generated idempotency key.
-- The sync authorize flow upserts rows; webhook_confirmed_at stays NULL until
-- the async notification (the source of truth) arrives.
CREATE TABLE payments (
  idempotency_key      TEXT PRIMARY KEY,
  psp                  TEXT NOT NULL,
  psp_reference        TEXT UNIQUE,
  reference            TEXT NOT NULL,
  amount               INTEGER NOT NULL,
  currency             TEXT NOT NULL,
  status               TEXT NOT NULL CHECK (status IN ('authorised', 'refused', 'pending', 'error')),
  webhook_confirmed_at TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX payments_created_at ON payments (created_at DESC);

CREATE TABLE webhook_events (
  psp_reference TEXT NOT NULL,
  event_code    TEXT NOT NULL,
  success       TEXT NOT NULL,
  raw           TEXT NOT NULL,
  received_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (psp_reference, event_code, success)
);
