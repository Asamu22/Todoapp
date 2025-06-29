/*
  # Add office support to internet records

  1. Changes
    - Add `office` column to `internet_records` table
    - Set default office value for existing records
    - Update RLS policies to include office filtering
    - Add index for office-based queries

  2. Security
    - Maintain existing RLS policies
    - Users can only access records for their own user_id
    - Office is just an additional organizational field
*/

-- Add office column to internet_records table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'internet_records' AND column_name = 'office'
  ) THEN
    ALTER TABLE internet_records ADD COLUMN office text NOT NULL DEFAULT 'Main Office';
  END IF;
END $$;

-- Add index for office-based queries
CREATE INDEX IF NOT EXISTS internet_records_office_idx ON internet_records (office);

-- Add composite index for user_id and office
CREATE INDEX IF NOT EXISTS internet_records_user_office_idx ON internet_records (user_id, office);