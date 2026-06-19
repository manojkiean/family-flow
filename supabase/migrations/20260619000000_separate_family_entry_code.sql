-- Separate parent auth password from the family entry code.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auth_password TEXT;

UPDATE public.profiles
SET auth_password = COALESCE(auth_password, family_password)
WHERE auth_password IS NULL;

UPDATE public.profiles
SET family_password = COALESCE(family_password, 'family123')
WHERE family_password IS NULL;

DROP FUNCTION IF EXISTS public.verify_child_login(TEXT, TEXT);

CREATE FUNCTION public.verify_child_login(p_member_email TEXT, p_pin TEXT)
RETURNS TABLE (auth_email TEXT, auth_password TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.email::TEXT AS auth_email,
    p.auth_password::TEXT AS auth_password
  FROM public.family_members fm
  JOIN public.families fam ON fam.id = fm.family_id
  JOIN public.profiles p ON p.user_id = fam.owner_id
  JOIN auth.users au ON au.id = fam.owner_id
  WHERE LOWER(fm.email) = LOWER(p_member_email)
    AND fm.pin = p_pin
    AND p.auth_password IS NOT NULL
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';