/*
  # Add foreign key relationships to user_profiles

  This migration adds the missing foreign key constraints that allow Supabase PostgREST
  to automatically detect relationships between audit_logs/deleted_records and user_profiles.

  ## Changes Made

  1. **audit_logs table**
     - Add foreign key constraint linking user_id to user_profiles.user_id
     - This enables joining audit_logs with user_profiles in queries

  2. **deleted_records table** 
     - Add foreign key constraint linking user_id to user_profiles.user_id
     - Add foreign key constraint linking deleted_by to user_profiles.user_id
     - This enables joining deleted_records with user_profiles for both user and deleted_by relationships

  ## Security
  - No changes to RLS policies (existing policies remain in effect)
  - Foreign keys use CASCADE/SET NULL appropriately to maintain data integrity
*/

-- Add foreign key constraint for audit_logs.user_id -> user_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'audit_logs_user_profiles_fkey'
    AND table_name = 'audit_logs'
  ) THEN
    ALTER TABLE audit_logs 
    ADD CONSTRAINT audit_logs_user_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint for deleted_records.user_id -> user_profiles.user_id  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'deleted_records_user_profiles_fkey'
    AND table_name = 'deleted_records'
  ) THEN
    ALTER TABLE deleted_records 
    ADD CONSTRAINT deleted_records_user_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint for deleted_records.deleted_by -> user_profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'deleted_records_deleted_by_profiles_fkey'
    AND table_name = 'deleted_records'
  ) THEN
    ALTER TABLE deleted_records 
    ADD CONSTRAINT deleted_records_deleted_by_profiles_fkey 
    FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;