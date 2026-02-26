-- Update child login to use child's own email + PIN
CREATE OR REPLACE FUNCTION public.verify_child_login(p_member_email TEXT, p_pin TEXT)
RETURNS TABLE (auth_email TEXT, auth_password TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email::TEXT,
    p.family_password::TEXT
  FROM public.family_members fm
  JOIN public.profiles p ON p.user_id = fm.user_id
  JOIN auth.users au ON au.id = p.user_id
  WHERE LOWER(fm.email) = LOWER(p_member_email) 
    AND fm.pin = p_pin
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
