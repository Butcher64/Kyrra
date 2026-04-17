-- Migration 034: enforce Kyrra defaults at positions 0-6, Gmail labels after
--
-- Context: configure-labels/page.tsx previously iterated Gmail labels first and
-- pushed them to the merged[] array BEFORE the Kyrra defaults. The save_user_labels
-- RPC assigned `position` from the array index, so defaults ended up at positions
-- 5-13 on users with many Gmail labels. The dashboard keys "blocked" on
-- position >= 5, which then incorrectly flagged Gmail labels (Notifications,
-- Newsletter, etc.) as blocked and mis-counted spam/prospection.
--
-- The page is now fixed (defaults always first). This migration repairs
-- already-broken rows in prod by re-numbering positions in place.

BEGIN;

-- Step 1: assign DEFAULT_LABELS order to rows matching the canonical default names
-- (they may have been renamed to a Gmail label name on match — in that case we
-- can't recover the original default without a join on (is_default, name), so we
-- only reorder rows where name still matches one of the canonical defaults).
WITH canonical AS (
  SELECT * FROM (VALUES
    ('Important',         0),
    ('Transactionnel',    1),
    ('Notifications',     2),
    ('Newsletter',        3),
    ('Prospection utile', 4),
    ('Prospection',       5),
    ('Spam',              6)
  ) AS t(name, target_position)
),
-- For each user, first assign target positions to default rows by name match
default_moves AS (
  SELECT
    ul.id,
    ul.user_id,
    c.target_position AS new_position
  FROM user_labels ul
  JOIN canonical c ON c.name = ul.name
  WHERE ul.is_default = true
),
-- Then enumerate remaining rows per user with a new position starting at 7
remaining_moves AS (
  SELECT
    ul.id,
    ul.user_id,
    (6 + ROW_NUMBER() OVER (PARTITION BY ul.user_id ORDER BY ul.position, ul.id))::int AS new_position
  FROM user_labels ul
  LEFT JOIN default_moves dm ON dm.id = ul.id
  WHERE dm.id IS NULL
),
all_moves AS (
  SELECT id, user_id, new_position FROM default_moves
  UNION ALL
  SELECT id, user_id, new_position FROM remaining_moves
)
-- Two-phase update to avoid UNIQUE(user_id, position) collisions: shift to a
-- safe offset first, then set to the target.
UPDATE user_labels
SET position = position + 1000
WHERE id IN (SELECT id FROM all_moves);

WITH canonical AS (
  SELECT * FROM (VALUES
    ('Important',         0),
    ('Transactionnel',    1),
    ('Notifications',     2),
    ('Newsletter',        3),
    ('Prospection utile', 4),
    ('Prospection',       5),
    ('Spam',              6)
  ) AS t(name, target_position)
),
default_moves AS (
  SELECT
    ul.id,
    ul.user_id,
    c.target_position AS new_position
  FROM user_labels ul
  JOIN canonical c ON c.name = ul.name
  WHERE ul.is_default = true
),
remaining_moves AS (
  SELECT
    ul.id,
    ul.user_id,
    (6 + ROW_NUMBER() OVER (PARTITION BY ul.user_id ORDER BY ul.position, ul.id))::int AS new_position
  FROM user_labels ul
  LEFT JOIN default_moves dm ON dm.id = ul.id
  WHERE dm.id IS NULL
),
all_moves AS (
  SELECT id, user_id, new_position FROM default_moves
  UNION ALL
  SELECT id, user_id, new_position FROM remaining_moves
)
UPDATE user_labels ul
SET position = am.new_position,
    updated_at = NOW()
FROM all_moves am
WHERE ul.id = am.id;

COMMIT;
