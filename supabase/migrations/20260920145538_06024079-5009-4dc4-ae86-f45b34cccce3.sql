
CREATE TYPE public.app_role AS ENUM ('student','officer','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('officer','admin'));
$$;

CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  dob date,
  gender text,
  state text,
  district text,
  tribe text,
  st_status boolean NOT NULL DEFAULT true,
  pvtg_status boolean NOT NULL DEFAULT false,
  aadhaar_masked text,
  identity_verified boolean NOT NULL DEFAULT false,
  annual_income numeric,
  parent_name text,
  parent_occupation text,
  institution text,
  aishe_code text,
  course text,
  degree_level text,
  year_of_study int,
  enrollment_no text,
  academic_score numeric,
  bank_account_name text,
  bank_name text,
  account_number_masked text,
  ifsc text,
  dbt_enabled boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select" ON public.student_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "sp_insert" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sp_update" ON public.student_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.owns_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.student_profiles s WHERE s.id = _student_id AND s.user_id = auth.uid())
      OR public.is_staff(auth.uid());
$$;

CREATE TABLE public.scholarship_schemes (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL,
  target text NOT NULL,
  ministry text NOT NULL DEFAULT 'Ministry of Tribal Affairs',
  eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_documents text[] NOT NULL DEFAULT '{}',
  award_amount numeric,
  deadline date,
  status text NOT NULL DEFAULT 'open',
  version int NOT NULL DEFAULT 1,
  effective_date date NOT NULL DEFAULT current_date,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scholarship_schemes TO anon, authenticated;
GRANT INSERT, UPDATE ON public.scholarship_schemes TO authenticated;
GRANT ALL ON public.scholarship_schemes TO service_role;
ALTER TABLE public.scholarship_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schemes_public_read" ON public.scholarship_schemes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "schemes_admin_write" ON public.scholarship_schemes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "schemes_admin_insert" ON public.scholarship_schemes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  scheme_id text NOT NULL REFERENCES public.scholarship_schemes(id),
  reference_no text NOT NULL DEFAULT ('TL-' || upper(substr(md5(random()::text),1,8))),
  status text NOT NULL DEFAULT 'submitted',
  readiness int NOT NULL DEFAULT 0,
  remarks text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_select" ON public.applications FOR SELECT TO authenticated USING (public.owns_student(student_id));
CREATE POLICY "app_insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (public.owns_student(student_id));
CREATE POLICY "app_update" ON public.applications FOR UPDATE TO authenticated USING (public.owns_student(student_id));

CREATE TABLE public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ae_select" ON public.application_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.owns_student(a.student_id)));
CREATE POLICY "ae_insert" ON public.application_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.owns_student(a.student_id)));

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  name text NOT NULL,
  file_url text,
  source text NOT NULL DEFAULT 'upload',
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  mismatch_notes text[] NOT NULL DEFAULT '{}',
  verification_status text NOT NULL DEFAULT 'pending',
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_all" ON public.documents FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));

CREATE TABLE public.verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source text,
  remarks text,
  verified_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_records TO authenticated;
GRANT ALL ON public.verification_records TO service_role;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vr_all" ON public.verification_records FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  scheme_id text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sanctioned',
  transaction_reference text,
  sanction_date date,
  payment_date date,
  bank_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay_all" ON public.payments FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  student_id uuid REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read_status boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_all" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR (student_id IS NOT NULL AND public.owns_student(student_id)))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()) OR (student_id IS NOT NULL AND public.owns_student(student_id)));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  message text NOT NULL,
  lang text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_all" ON public.chat_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.beneficiary_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_reference text NOT NULL,
  name text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  institution text NOT NULL,
  course text,
  potential_scheme text,
  confidence numeric NOT NULL DEFAULT 0.7,
  reasons text[] NOT NULL DEFAULT '{}',
  data_sources text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'identified',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.beneficiary_gaps TO authenticated;
GRANT ALL ON public.beneficiary_gaps TO service_role;
ALTER TABLE public.beneficiary_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gap_staff_select" ON public.beneficiary_gaps FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "gap_staff_update" ON public.beneficiary_gaps FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_staff_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.scholarship_schemes (id,name,short_name,description,target,eligibility_rules,required_documents,award_amount,deadline,status) VALUES
('pre-matric','Pre-Matric Scholarship for ST Students','Pre-Matric','Financial assistance to ST students studying in classes IX and X to reduce drop-out at the elementary-to-secondary transition.','ST students in Class IX-X','{"max_income":250000,"levels":["school"],"min_score":0,"requires_st":true,"notes":"Parental income limit as configured for the prototype."}','{ST Certificate,Income Certificate,Aadhaar/Identity Proof,Academic Marksheet,Bonafide Certificate,Bank Passbook}',12000,'2026-12-31','open'),
('post-matric','Post-Matric Scholarship for ST Students','Post-Matric','Support for ST students pursuing post-matriculation or post-secondary studies in recognised institutions.','ST students in Class XI and above','{"max_income":250000,"levels":["higher_secondary","ug","pg"],"min_score":40,"requires_st":true}','{ST Certificate,Income Certificate,Aadhaar/Identity Proof,Academic Marksheet,Institution Certificate,Bank Passbook}',18000,'2026-11-30','open'),
('top-class','Top Class Education for ST Students','Top Class','Full support for ST students admitted to notified premier institutions across professional and technical streams.','ST students in notified premier institutions','{"max_income":600000,"levels":["ug","pg"],"min_score":60,"requires_st":true,"requires_admission_proof":true}','{ST Certificate,Income Certificate,Aadhaar/Identity Proof,Academic Marksheet,Admission Proof,Institution Certificate,Bank Passbook}',200000,'2026-10-31','open'),
('nfst','National Fellowship for ST Students','NFST','Fellowship for ST scholars pursuing M.Phil and Ph.D programmes in recognised universities and institutions.','ST research scholars (M.Phil / Ph.D)','{"max_income":null,"levels":["mphil","phd"],"min_score":55,"requires_st":true,"one_benefit_only":true}','{ST Certificate,Aadhaar/Identity Proof,Academic Marksheet,Admission Proof,Institution Certificate,Bank Passbook}',372000,'2026-09-30','open'),
('nos','National Overseas Scholarship for ST Students','NOS','Support for ST students for higher studies abroad at master''s level and Ph.D programmes.','ST students pursuing higher studies abroad','{"max_income":600000,"levels":["pg","phd"],"min_score":60,"requires_st":true,"requires_passport":true,"one_benefit_only":true}','{ST Certificate,Income Certificate,Aadhaar/Identity Proof,Academic Marksheet,Passport,Admission Proof,Bank Passbook}',1500000,'2026-08-31','closed');
