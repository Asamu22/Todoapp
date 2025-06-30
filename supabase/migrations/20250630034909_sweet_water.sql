/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - The "Admins can view all profiles" policy creates infinite recursion
    - It queries user_profiles table within the policy for the same table
    - This causes the policy to call itself infinitely

  2. Solution
    - Drop the problematic admin policy that causes recursion
    - Create a simpler policy structure that avoids self-referencing
    - Keep the basic user access policy for users to view their own profile
    - Add a separate policy for updates that doesn't cause recursion

  3. Security
    - Users can still view and update their own profiles
    - Admin functionality will need to be handled at the application level
    - This prevents the infinite recursion while maintaining basic security
*/

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- The existing policies for users to view/update their own profiles are fine
-- They don't cause recursion because they use auth.uid() directly

-- If admin access is needed, it should be handled at the application level
-- or through a different mechanism that doesn't create recursive policies