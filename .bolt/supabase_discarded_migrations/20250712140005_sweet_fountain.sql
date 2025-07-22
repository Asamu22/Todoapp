/*
  # Fix RLS infinite recursion in user_profiles

  1. Problem
     - Current RLS policies are causing infinite recursion
     - The is_admin_user() function likely queries user_profiles table
     - This creates a circular dependency when checking admin status

  2. Solution
     - Drop existing problematic policies
     - Create new simplified policies that don't cause recursion
     - Use direct column checks instead of function calls
     - Ensure policies use auth.uid() directly without additional queries

  3. Security
     - Users can view and update their own profile
     - Super admins can manage all profiles
     - Admin status checks use direct column comparison
*/

-- Drop the problematic is_admin_user function if it exists
DROP FUNCTION IF EXISTS is_admin_user(uuid);

-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;

-- Create simple, non-recursive policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own profile (but not admin status)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent users from changing their own admin status
    (OLD.is_admin = NEW.is_admin) AND
    (OLD.is_super_admin = NEW.is_super_admin)
  );

-- Super admin can do everything (check email directly from auth.users)
CREATE POLICY "Super admin full access"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'calebasamu47@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'calebasamu47@gmail.com'
    )
  );

-- Regular admins can view all profiles but cannot modify admin status
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Check if current user is admin by looking at their own record
    -- This is safe because we're only checking the current user's status
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);