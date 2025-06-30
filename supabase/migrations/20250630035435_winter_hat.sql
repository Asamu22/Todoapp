/*
  # Setup Default Admin User and Enhanced Admin System

  1. Create default admin user with credentials:
     - Email: calebasamu47@gmail.com
     - Password: @c@lt3ch
     - Set as super admin (can add other admins)

  2. Enhanced user profiles table:
     - Add is_super_admin field for the default admin
     - Only super admin can promote users to admin

  3. Security:
     - Enhanced RLS policies
     - Admin management functions
     - Secure admin promotion system
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

-- Function to create the default admin user
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if default admin already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'calebasamu47@gmail.com';
  
  IF admin_user_id IS NULL THEN
    -- Create the admin user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'calebasamu47@gmail.com',
      crypt('@c@lt3ch', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
  END IF;

  -- Create or update user profile for admin
  INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    is_admin,
    is_super_admin
  ) VALUES (
    admin_user_id,
    'calebasamu47@gmail.com',
    'System Administrator',
    true,
    true
  ) ON CONFLICT (user_id) DO UPDATE SET
    is_admin = true,
    is_super_admin = true,
    email = 'calebasamu47@gmail.com',
    full_name = 'System Administrator';

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
  SET is_admin = true
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
  SET is_admin = false
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for admin management
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;
CREATE POLICY "Super admin can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.is_super_admin = true
    )
  );

-- Policy for regular admins to view profiles (but not modify admin status)
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
CREATE POLICY "Admins can view profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- Execute the function to create default admin
SELECT create_default_admin();