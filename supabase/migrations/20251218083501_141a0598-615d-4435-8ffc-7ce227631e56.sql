-- Add missing UPDATE and DELETE policies for categorized_accounts table
CREATE POLICY "Users can update their own accounts" 
ON public.categorized_accounts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.categorized_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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