/*
  # Create internet_records table for Internet Subscription Monitoring

  1. New Tables
    - `internet_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, required)
      - `start_balance` (numeric, required)
      - `end_balance` (numeric, required)
      - `usage` (numeric, calculated field)
      - `work_hours` (numeric, required)
      - `notes` (text, optional)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `internet_records` table
    - Add policy for authenticated users to manage their own records
    - Users can only access their own internet records

  3. Indexes
    - Index on user_id for efficient queries
    - Index on date for sorting and filtering
    - Unique constraint on user_id + date to prevent duplicate entries per day
*/

CREATE TABLE IF NOT EXISTS internet_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_balance numeric(10,2) NOT NULL,
  end_balance numeric(10,2) NOT NULL,
  usage numeric(10,2) NOT NULL,
  work_hours numeric(4,1) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE internet_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own internet records"
  ON internet_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own internet records"
  ON internet_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own internet records"
  ON internet_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own internet records"
  ON internet_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS internet_records_user_id_idx ON internet_records(user_id);
CREATE INDEX IF NOT EXISTS internet_records_date_idx ON internet_records(date DESC);
CREATE INDEX IF NOT EXISTS internet_records_created_at_idx ON internet_records(created_at DESC);

-- Create unique constraint to prevent duplicate entries per user per day
CREATE UNIQUE INDEX IF NOT EXISTS internet_records_user_date_unique 
  ON internet_records(user_id, date);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_internet_records_updated_at 
  BEFORE UPDATE ON internet_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();