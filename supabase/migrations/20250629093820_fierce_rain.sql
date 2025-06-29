/*
  # Create todos table for Daily Activity Tracker

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, required)
      - `description` (text, optional)
      - `category` (text, required)
      - `priority` (text, required - low/medium/high)
      - `due_time` (text, optional - HH:MM format)
      - `completed` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `completed_at` (timestamptz, optional)

  2. Security
    - Enable RLS on `todos` table
    - Add policy for authenticated users to manage their own todos
    - Users can only access their own todo items

  3. Indexes
    - Index on user_id for efficient queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Personal',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_time text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON todos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_created_at_idx ON todos(created_at DESC);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON todos(completed);
CREATE INDEX IF NOT EXISTS todos_priority_idx ON todos(priority);