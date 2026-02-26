-- Add a hidden child access password to profiles
-- This allows children to login to the same family account using just their PIN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family_password TEXT DEFAULT 'family123';

-- Function to verify child pin and get the family login data
-- This is a SECURITY DEFINER function to bypass RLS for the login check
CREATE OR REPLACE FUNCTION public.verify_child_login(p_email TEXT, p_pin TEXT)
RETURNS TABLE (auth_email TEXT, auth_password TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email::TEXT,
    p.family_password::TEXT
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  JOIN public.family_members fm ON fm.user_id = p.user_id
  WHERE au.email = p_email 
    AND fm.pin = p_pin
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
