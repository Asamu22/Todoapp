/*
  # Drop all admin-related database objects with CASCADE

  This migration removes all admin functionality from the database:
  1. Drop admin-related policies that depend on is_admin_user function
  2. Drop the is_admin_user function with CASCADE
  3. Remove admin columns from user_profiles table
  4. Drop admin-related tables (audit_logs, deleted_records)
  5. Drop admin-related functions and triggers
*/

-- Drop policies that depend on is_admin_user function
DROP POLICY IF EXISTS "Admins can view all internet records" ON internet_records;
DROP POLICY IF EXISTS "Admins can view all todos" ON todos;
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all deleted records" ON deleted_records;
DROP POLICY IF EXISTS "Admins can restore deleted records" ON deleted_records;

-- Drop the is_admin_user function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS is_admin_user(uuid) CASCADE;

-- Drop admin-related tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS deleted_records CASCADE;

-- Remove admin columns from user_profiles table
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_admin CASCADE;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_super_admin CASCADE;

-- Drop admin-related functions and triggers
DROP FUNCTION IF EXISTS create_audit_log() CASCADE;
DROP TRIGGER IF EXISTS todos_audit_trigger ON todos;
DROP TRIGGER IF EXISTS internet_records_audit_trigger ON internet_records;

-- Drop any remaining admin-related indexes
DROP INDEX IF EXISTS user_profiles_is_admin_idx;
DROP INDEX IF EXISTS user_profiles_is_super_admin_idx;

-- Recreate simple policies for the remaining tables without admin functionality
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

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);