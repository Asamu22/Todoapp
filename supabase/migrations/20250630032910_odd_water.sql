/*
  # Update internet records unique constraint to allow multiple offices per date

  1. Changes
    - Drop the existing unique constraint on user_id + date
    - Add new unique constraint on user_id + date + office
    - This allows multiple records per date as long as they're for different offices

  2. Security
    - Maintain existing RLS policies
    - Users can still only access their own records
*/

-- Drop the existing unique constraint
DROP INDEX IF EXISTS internet_records_user_date_unique;

-- Create new unique constraint that includes office
CREATE UNIQUE INDEX IF NOT EXISTS internet_records_user_date_office_unique 
  ON internet_records(user_id, date, office);