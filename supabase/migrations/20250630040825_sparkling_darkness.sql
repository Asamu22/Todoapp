/*
  # Add foreign key relationships between audit/deleted records and user_profiles

  1. Changes
    - Add unique constraint on user_profiles.user_id (required for foreign key references)
    - Add foreign key constraint for audit_logs.user_id -> user_profiles.user_id
    - Add foreign key constraint for deleted_records.user_id -> user_profiles.user_id
    - Add foreign key constraint for deleted_records.deleted_by -> user_profiles.user_id

  2. Security
    - No changes to RLS policies needed
    - Foreign keys will enable proper joins in PostgREST queries
*/

-- First, add unique constraint on user_profiles.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_unique'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

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