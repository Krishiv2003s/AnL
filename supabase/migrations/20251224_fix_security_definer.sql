-- Fix SECURITY DEFINER privilege escalation vulnerability
-- Replace handle_new_user function to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the function runs with the privileges of the calling user, not elevated privileges

-- Drop and recreate the function with SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  clean_username TEXT;
BEGIN
  -- Extract and validate username
  clean_username := TRIM(NEW.raw_user_meta_data ->> 'username');
  
  -- Validate length (2-50 characters) and sanitize
  IF clean_username IS NOT NULL THEN
    -- Enforce length limits
    IF LENGTH(clean_username) < 2 OR LENGTH(clean_username) > 50 THEN
      clean_username := NULL;
    ELSE
      -- Remove potentially dangerous characters (allow alphanumeric, underscore, hyphen)
      clean_username := REGEXP_REPLACE(clean_username, '[^a-zA-Z0-9_\-]', '', 'g');
      -- Re-check length after sanitization
      IF LENGTH(clean_username) < 2 THEN
        clean_username := NULL;
      END IF;
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, clean_username);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Insert profile without username to prevent auth flow failure
    INSERT INTO public.profiles (user_id, username)
    VALUES (NEW.id, NULL);
    RETURN NEW;
END;
$$;

-- Grant necessary permissions for the trigger to work with SECURITY INVOKER
-- The trigger needs to be able to insert into profiles table
-- RLS policies already allow users to insert their own profiles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
