
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.owns_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_student(uuid) TO authenticated;
