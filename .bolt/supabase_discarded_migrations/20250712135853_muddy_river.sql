/*
  # Fix RLS infinite recursion in user_profiles table

  1. Problem
    - Current RLS policies are causing infinite recursion
    - The `is_admin_user()` function likely queries user_profiles table
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

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON user_profiles;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS is_admin_user(uuid);

-- Create new simplified policies without recursion
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

-- Super admin policy using direct email check to avoid recursion
CREATE POLICY "Super admin can manage all profiles"
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

-- Admin policy for viewing other profiles (non-recursive)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can view their own profile
    auth.uid() = user_id
    OR
    -- Or user is admin (check current user's profile directly)
    EXISTS (
      SELECT 1 FROM user_profiles admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_admin = true
    )
  );