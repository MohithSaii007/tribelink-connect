DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','user_roles','student_profiles','scholarship_schemes','applications','application_events','documents','verification_records','payments','notifications','chat_messages','beneficiary_gaps','audit_logs'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
  EXECUTE 'GRANT SELECT ON public.scholarship_schemes TO anon';
END $$;