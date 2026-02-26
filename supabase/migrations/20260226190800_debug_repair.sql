-- DEBUG SCRIPT: Run this to see what is in your database
SELECT 
  au.email as parent_email,
  p.family_password,
  fm.name as member_name,
  fm.role as member_role,
  fm.pin as member_pin
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
JOIN public.family_members fm ON fm.user_id = p.user_id;

-- REPAIR SCRIPT: Run this to make sure everything is linked correctly
-- Sometimes user_id in family_members gets disconnected
UPDATE public.family_members fm
SET user_id = p.user_id
FROM public.profiles p
WHERE fm.user_id IS NULL; -- Fixes members that aren't linked to a parent account
