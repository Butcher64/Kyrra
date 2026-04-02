-- Migration 026: Atomic save_user_labels RPC
-- Wraps delete + insert in a single transaction to prevent partial failures
-- (B1.8: if INSERT fails after DELETE, user loses all labels)

CREATE OR REPLACE FUNCTION save_user_labels(
  p_labels JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_label JSONB;
  v_position INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate input
  IF jsonb_array_length(p_labels) < 2 THEN
    RAISE EXCEPTION 'Minimum 2 labels required';
  END IF;
  IF jsonb_array_length(p_labels) > 15 THEN
    RAISE EXCEPTION 'Maximum 15 labels';
  END IF;

  -- Validate label names before any mutation
  FOR v_label IN SELECT * FROM jsonb_array_elements(p_labels)
  LOOP
    IF (v_label->>'name') IS NULL OR trim(v_label->>'name') = '' THEN
      RAISE EXCEPTION 'Label name cannot be empty';
    END IF;
  END LOOP;

  -- Check for duplicate names within the payload
  IF (SELECT count(*) FROM jsonb_array_elements(p_labels) AS el
      GROUP BY el->>'name' HAVING count(*) > 1 LIMIT 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate label name in configuration';
  END IF;

  -- Atomic: delete + insert in a single transaction
  DELETE FROM user_labels WHERE user_id = v_user_id;

  -- Position is determined by array order (index 0, 1, 2...)
  FOR v_label IN SELECT * FROM jsonb_array_elements(p_labels)
  LOOP
    INSERT INTO user_labels (
      user_id, name, description, prompt, color,
      gmail_label_id, gmail_label_name, is_default, position
    ) VALUES (
      v_user_id,
      trim(v_label->>'name'),
      v_label->>'description',
      v_label->>'prompt',
      v_label->>'color',
      v_label->>'gmail_label_id',
      v_label->>'gmail_label_name',
      COALESCE((v_label->>'is_default')::boolean, false),
      v_position
    );
    v_position := v_position + 1;
  END LOOP;
END;
$$;

-- Restrict access: only authenticated users (not anon/public)
REVOKE EXECUTE ON FUNCTION save_user_labels(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_user_labels(JSONB) TO authenticated;
