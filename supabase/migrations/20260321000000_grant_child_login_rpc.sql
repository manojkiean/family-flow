-- Grant anon (unauthenticated) users the ability to call verify_child_login.
-- This is safe because the function only returns auth_email + family_password
-- when the correct email + PIN combination is supplied. It cannot be used to
-- enumerate emails or brute-force without a valid matching PIN.
GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_child_login(TEXT, TEXT) TO authenticated;
