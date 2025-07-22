/*
  # Fix user creation issues

  1. Database Schema Fixes
    - Ensure user_profiles table has proper constraints
    - Fix any NOT NULL constraints that could block user creation
    - Add proper default values where needed

  2. RLS Policy Fixes
    - Ensure INSERT policies allow new user profile creation
    - Fix any circular dependencies in policies

  3. Trigger Improvements
    - Improve user profile creation trigger with better error handling
    - Ensure trigger doesn't fail on edge cases

  4. Function Updates
    - Update functions to handle user creation properly
*/

-- First, let's fix the user_profiles table structure
ALTER TABLE user_profiles 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL;

-- Ensure we have proper defaults
ALTER TABLE user_profiles 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Drop and recreate the user profile creation trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create improved user profile creation function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_profiles (
      user_id,
      email,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Ensure RLS is enabled on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create simple, non-recursive RLS policies
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

-- Update last login trigger to be more robust
DROP TRIGGER IF EXISTS update_last_login_trigger ON user_profiles;
DROP FUNCTION IF EXISTS update_last_login();

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_login for the user's profile
  UPDATE public.user_profiles 
  SET last_login = now(), updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if profile doesn't exist yet
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the last login trigger
CREATE TRIGGER update_last_login_trigger
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();

-- Ensure todos table has proper RLS policies without admin dependencies
DROP POLICY IF EXISTS "Admins can view all todos" ON todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;

-- Create simple RLS policies for todos
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

-- Ensure internet_records table has proper RLS policies without admin dependencies
DROP POLICY IF EXISTS "Admins can view all internet records" ON internet_records;
DROP POLICY IF EXISTS "Users can view their own internet records" ON internet_records;
DROP POLICY IF EXISTS "Users can insert their own internet records" ON internet_records;
DROP POLICY IF EXISTS "Users can update their own internet records" ON internet_records;
DROP POLICY IF EXISTS "Users can delete their own internet records" ON internet_records;

-- Create simple RLS policies for internet_records
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