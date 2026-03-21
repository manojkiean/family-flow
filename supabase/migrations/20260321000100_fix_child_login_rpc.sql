-- Fix verify_child_login to work regardless of whether the child has a user_id.
-- The old approach JOINed family_members → profiles via family_members.user_id,
-- which fails for children added via the UI (they have user_id = null).
--
-- New approach: look up the child by email+PIN in family_members,
-- find their family, get the OWNER's (parent's) auth credentials.
-- Children log into the parent's Supabase auth account using the family_password.

DROP FUNCTION IF EXISTS public.verify_child_login(text, text);

CREATE FUNCTION public.verify_child_login(p_member_email TEXT, p_pin TEXT)
RETURNS TABLE (auth_email TEXT, auth_password TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.email::TEXT       AS auth_email,
    p.family_password::TEXT AS auth_password
  FROM public.family_members fm
  JOIN public.families fam   ON fam.id        = fm.family_id
  JOIN public.profiles p     ON p.user_id     = fam.owner_id
  JOIN auth.users au         ON au.id         = fam.owner_id
  WHERE LOWER(fm.email) = LOWER(p_member_email)
    AND fm.pin           = p_pin
    AND p.family_password IS NOT NULL
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
