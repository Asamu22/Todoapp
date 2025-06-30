/*
  # Setup Default Admin System

  1. Changes
    - Add is_super_admin column to user_profiles
    - Create functions for admin management
    - Set up default admin user
    - Update RLS policies for admin access

  2. Security
    - Only super admin can promote/demote other admins
    - Enhanced RLS policies for admin operations
    - Secure functions with proper access control
*/

-- Add is_super_admin column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create index for super admin queries
CREATE INDEX IF NOT EXISTS user_profiles_is_super_admin_idx ON user_profiles(is_super_admin);

-- Function to safely create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_is_admin boolean,
  p_is_super_admin boolean
)
RETURNS void AS $$
BEGIN
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
    -- Update existing profile
    UPDATE user_profiles 
    SET 
      email = p_email,
      full_name = p_full_name,
      is_admin = p_is_admin,
      is_super_admin = p_is_super_admin,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Insert new profile
    INSERT INTO user_profiles (
      user_id,
      email,
      full_name,
      is_admin,
      is_super_admin
    ) VALUES (
      p_user_id,
      p_email,
      p_full_name,
      p_is_admin,
      p_is_super_admin
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the default admin user
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  admin_exists boolean := false;
BEGIN
  -- Check if default admin already exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'calebasamu47@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    admin_exists := true;
  END IF;

  -- If admin doesn't exist in auth.users, we need to create a user profile anyway
  -- for when they sign up normally through the app
  IF NOT admin_exists THEN
    -- Generate a placeholder user ID for the profile
    admin_user_id := gen_random_uuid();
    
    -- Note: The actual auth.users entry will be created when the admin signs up
    -- through the normal authentication flow. This just prepares the profile.
  END IF;

  -- Create or update user profile for admin using the safe upsert function
  PERFORM upsert_user_profile(
    admin_user_id,
    'calebasamu47@gmail.com',
    'System Administrator',
    true,
    true
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (only super admin can do this)
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_email text)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  is_super_admin_user boolean;
  target_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if current user is super admin
  SELECT is_super_admin INTO is_super_admin_user
  FROM user_profiles
  WHERE user_id = current_user_id;
  
  IF NOT COALESCE(is_super_admin_user, false) THEN
    RAISE EXCEPTION 'Only super admin can promote users to admin';
  END IF;
  
  -- Get target user ID
  SELECT user_id INTO target_user_id
  FROM user_profiles
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Promote user to admin
  UPDATE user_profiles
  SET 
    is_admin = true,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin (only super admin can do this)
CREATE OR REPLACE FUNCTION demote_admin_user(target_email text)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  is_super_admin_user boolean;
  target_user_id uuid;
  target_is_super_admin boolean;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if current user is super admin
  SELECT is_super_admin INTO is_super_admin_user
  FROM user_profiles
  WHERE user_id = current_user_id;
  
  IF NOT COALESCE(is_super_admin_user, false) THEN
    RAISE EXCEPTION 'Only super admin can demote admin users';
  END IF;
  
  -- Get target user info
  SELECT user_id, is_super_admin INTO target_user_id, target_is_super_admin
  FROM user_profiles
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Cannot demote super admin
  IF COALESCE(target_is_super_admin, false) THEN
    RAISE EXCEPTION 'Cannot demote super admin';
  END IF;
  
  -- Demote user
  UPDATE user_profiles
  SET 
    is_admin = false,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  result boolean := false;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COALESCE(is_super_admin, false) INTO result
  FROM user_profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin (regular or super)
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  result boolean := false;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COALESCE(is_admin, false) INTO result
  FROM user_profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for admin management
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;
CREATE POLICY "Super admin can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Policy for regular admins to view profiles (but not modify admin status)
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
CREATE POLICY "Admins can view profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Update existing policies for todos to allow admin access
DROP POLICY IF EXISTS "Admins can view all todos" ON todos;
CREATE POLICY "Admins can view all todos"
  ON todos
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Update existing policies for internet_records to allow admin access
DROP POLICY IF EXISTS "Admins can view all internet records" ON internet_records;
CREATE POLICY "Admins can view all internet records"
  ON internet_records
  FOR SELECT
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Execute the function to create default admin profile
SELECT create_default_admin();