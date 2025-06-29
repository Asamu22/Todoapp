/*
  # Add task scheduling fields

  1. Changes
    - Add `due_date` column for scheduling tasks on specific dates
    - Add `scheduled_for` column for precise date-time scheduling
    - Update existing tasks to maintain compatibility

  2. Security
    - No changes to RLS policies needed
    - Existing policies cover new columns
*/

-- Add new columns for task scheduling
DO $$
BEGIN
  -- Add due_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE todos ADD COLUMN due_date date;
  END IF;

  -- Add scheduled_for column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE todos ADD COLUMN scheduled_for timestamptz;
  END IF;
END $$;

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON todos(due_date);
CREATE INDEX IF NOT EXISTS todos_scheduled_for_idx ON todos(scheduled_for);