/*
  # Remove admin functionality and fix user signup issues

  1. Changes
    - Drop all admin-related RLS policies
    - Drop admin-related functions
    - Remove admin columns from user_profiles
    - Simplify user_profiles policies for basic user access
    - Remove audit logs and deleted records tables
    - Fix user profile creation trigger

  2. Security
    - Simple RLS policies for user_profiles
    - Users can only access their own profile
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all deleted records" ON deleted_records;
DROP POLICY IF EXISTS "Admins can restore deleted records" ON deleted_records;
DROP POLICY IF EXISTS "Admins can view all todos" ON todos;
DROP POLICY IF EXISTS "Admins can view all internet records" ON internet_records;

-- Drop admin-related functions
DROP FUNCTION IF EXISTS is_admin_user(uuid);
DROP FUNCTION IF EXISTS promote_user_to_admin(text);
DROP FUNCTION IF EXISTS demote_admin_user(text);
DROP FUNCTION IF EXISTS create_audit_log();

-- Drop admin-related tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS deleted_records CASCADE;

-- Remove admin columns from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS is_admin,
DROP COLUMN IF EXISTS is_super_admin;

-- Drop and recreate indexes without admin columns
DROP INDEX IF EXISTS user_profiles_is_admin_idx;
DROP INDEX IF EXISTS user_profiles_is_super_admin_idx;

-- Remove audit triggers from tables
DROP TRIGGER IF EXISTS todos_audit_trigger ON todos;
DROP TRIGGER IF EXISTS internet_records_audit_trigger ON internet_records;

-- Create simple RLS policies for user_profiles
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

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure the user profile creation trigger exists and works properly
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Update last_login trigger to be simpler
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET last_login = NOW()
  WHERE user_id = NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if profile doesn't exist
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_last_login_trigger ON auth.users;
CREATE TRIGGER update_last_login_trigger
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();