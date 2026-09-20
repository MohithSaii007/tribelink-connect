import { createServerFn } from "@tanstack/react-start";

/**
 * Idempotent synthetic demo seeding for the TRIBALINK prototype.
 * Creates the two demo accounts plus a synthetic cohort of students,
 * documents, applications, payments, notifications and outreach gaps.
 * All data is fabricated — no real person or government record is used.
 */

const DEMO_STUDENT = { email: "student@tribalink.demo", password: "Demo@123", name: "Meena Kujur" };
const DEMO_ADMIN = { email: "admin@tribalink.demo", password: "Admin@123", name: "R. Sahu (Reviewing Officer)" };

const STATES = [
  { state: "Jharkhand", districts: ["Khunti", "Gumla", "West Singhbhum"], tribe: "Munda" },
  { state: "Odisha", districts: ["Koraput", "Mayurbhanj", "Rayagada"], tribe: "Santhal" },
  { state: "Madhya Pradesh", districts: ["Dindori", "Mandla", "Jhabua"], tribe: "Gond" },
  { state: "Chhattisgarh", districts: ["Bastar", "Dantewada", "Kanker"], tribe: "Halba" },
  { state: "Maharashtra", districts: ["Nandurbar", "Gadchiroli", "Palghar"], tribe: "Bhil" },
  { state: "Rajasthan", districts: ["Banswara", "Dungarpur", "Udaipur"], tribe: "Meena" },
];

const FIRST = ["Meena", "Sunil", "Anita", "Ravi", "Phulmani", "Birsa", "Sita", "Lakhan", "Kamla", "Jaipal", "Sarita", "Mangal"];
const LAST = ["Kujur", "Munda", "Oraon", "Soren", "Marandi", "Bhagat", "Tudu", "Hembram", "Netam", "Uike", "Damor", "Rathva"];
const INSTITUTIONS = ["Govt. Degree College", "Kasturba Govt. Girls School", "Eklavya Model Residential School", "State Polytechnic", "Tribal Welfare Higher Secondary"];
const COURSES = ["B.Sc. Nursing", "B.A. History", "Diploma in Civil Engineering", "Class 9", "Class 11 Science", "B.Com", "M.A. Economics"];
const LEVELS = ["pre_matric", "post_matric", "undergraduate", "postgraduate"];
const STATUSES = ["draft", "submitted", "under_verification", "deficiency", "sanctioned", "dbt_processing", "paid"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length] as T;
}

export const seedDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count } = await supabaseAdmin.from("student_profiles").select("id", { count: "exact", head: true }).eq("is_demo", true);
  if ((count ?? 0) >= 20) {
    return { seeded: false, message: "Demo data is already loaded." };
  }

  // --- demo accounts -------------------------------------------------
  async function ensureUser(email: string, password: string, name: string, role: "student" | "admin") {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u) => u.email === email) ?? null;
    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) throw new Error(error.message);
      user = data.user;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    }
    await supabaseAdmin.from("profiles").upsert({ id: user!.id, full_name: name, email });
    const { data: existingRole } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", user!.id).eq("role", role).maybeSingle();
    if (!existingRole) await supabaseAdmin.from("user_roles").insert({ user_id: user!.id, role });
    return user!.id;
  }

  const studentUserId = await ensureUser(DEMO_STUDENT.email, DEMO_STUDENT.password, DEMO_STUDENT.name, "student");
  await ensureUser(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.name, "admin");

  const { data: schemes } = await supabaseAdmin.from("scholarship_schemes").select("id, short_name, award_amount");
  const schemeList = schemes ?? [];
  const schemeFor = (i: number) => schemeList[i % Math.max(1, schemeList.length)];

  // --- the signed-in demo student ------------------------------------
  const home = STATES[0]!;
  const demoStudent = {
    user_id: studentUserId,
    full_name: DEMO_STUDENT.name,
    email: DEMO_STUDENT.email,
    phone: "9876500001",
    dob: "2004-06-14",
    gender: "female",
    state: home.state,
    district: home.districts[0]!,
    tribe: home.tribe,
    st_status: true,
    pvtg_status: false,
    institution: "Govt. Degree College, Khunti",
    course: "B.Sc. Nursing",
    degree_level: "undergraduate",
    year_of_study: 2,
    academic_score: 78,
    annual_income: 96000,
    parent_name: "Budhram Kujur",
    parent_occupation: "Farmer",
    enrollment_no: "JH-UG-2023-0481",
    aishe_code: "C-41207",
    aadhaar_masked: "XXXX XXXX 4417",
    bank_name: "State Bank of India",
    bank_account_name: DEMO_STUDENT.name,
    account_number_masked: "XXXXXX7742",
    ifsc: "SBIN0004417",
    dbt_enabled: true,
    identity_verified: true,
    is_demo: true,
  };

  const { data: existingDemo } = await supabaseAdmin.from("student_profiles").select("id").eq("user_id", studentUserId).maybeSingle();
  let demoStudentId: string;
  if (existingDemo) {
    await supabaseAdmin.from("student_profiles").update(demoStudent).eq("id", existingDemo.id);
    demoStudentId = existingDemo.id;
  } else {
    const { data, error } = await supabaseAdmin.from("student_profiles").insert(demoStudent).select("id").single();
    if (error) throw new Error(error.message);
    demoStudentId = data.id;
  }

  const docs = [
    { doc_type: "aadhaar", name: "Aadhaar (masked)", source: "digilocker", verification_status: "verified", extracted_data: { name: DEMO_STUDENT.name, dob: "2004-06-14", aadhaar: "XXXX XXXX 4417" }, mismatch_notes: [] },
    { doc_type: "caste_certificate", name: "Scheduled Tribe certificate", source: "digilocker", verification_status: "verified", extracted_data: { tribe: "Munda", authority: "SDM Khunti", issued: "2022-03-11" }, mismatch_notes: [] },
    { doc_type: "income_certificate", name: "Income certificate", source: "e_district", verification_status: "deficiency", extracted_data: { annual_income: 104000, issued: "2024-05-02" }, mismatch_notes: ["Income on certificate (₹1,04,000) differs from the profile value (₹96,000)."] },
    { doc_type: "marksheet", name: "Previous year marksheet", source: "upload", verification_status: "verified", extracted_data: { percentage: 78, board: "Ranchi University" }, mismatch_notes: [] },
    { doc_type: "bonafide", name: "Bonafide / institution certificate", source: "upload", verification_status: "pending", extracted_data: { institution: "Govt. Degree College, Khunti" }, mismatch_notes: [] },
    { doc_type: "bank_passbook", name: "Bank passbook (DBT-seeded)", source: "upload", verification_status: "verified", extracted_data: { account: "XXXXXX7742", ifsc: "SBIN0004417" }, mismatch_notes: [] },
  ];
  const { count: docCount } = await supabaseAdmin.from("documents").select("id", { count: "exact", head: true }).eq("student_id", demoStudentId);
  if ((docCount ?? 0) === 0) {
    await supabaseAdmin.from("documents").insert(docs.map((d) => ({ ...d, student_id: demoStudentId })));
  }

  const { count: appCount } = await supabaseAdmin.from("applications").select("id", { count: "exact", head: true }).eq("student_id", demoStudentId);
  if ((appCount ?? 0) === 0 && schemeList.length > 0) {
    const post = schemeList.find((s) => s.short_name?.toLowerCase().includes("post")) ?? schemeList[0]!;
    const top = schemeList.find((s) => s.short_name?.toLowerCase().includes("top")) ?? schemeList[1] ?? post;
    const { data: apps } = await supabaseAdmin
      .from("applications")
      .insert([
        { student_id: demoStudentId, scheme_id: post.id, status: "under_verification", readiness: 84, remarks: "Income certificate mismatch pending officer review." },
        { student_id: demoStudentId, scheme_id: top.id, status: "draft", readiness: 61, remarks: null },
      ])
      .select("id, scheme_id, status");
    for (const a of apps ?? []) {
      await supabaseAdmin.from("application_events").insert([
        { application_id: a.id, status: "draft", note: "Application created from the unified profile." },
        ...(a.status === "under_verification"
          ? [
              { application_id: a.id, status: "submitted", note: "Submitted with six linked documents." },
              { application_id: a.id, status: "under_verification", note: "Institution and district verification in progress." },
            ]
          : []),
      ]);
    }
    await supabaseAdmin.from("payments").insert({
      student_id: demoStudentId,
      scheme_id: post.id,
      amount: Number(post.award_amount ?? 12000),
      status: "pending",
      bank_status: "Awaiting sanction (simulated)",
    });
  }

  const { count: notifCount } = await supabaseAdmin.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", studentUserId);
  if ((notifCount ?? 0) === 0) {
    await supabaseAdmin.from("notifications").insert([
      { user_id: studentUserId, title: "Welcome to TRIBALINK", message: "Your unified profile is ready. Verify once and reuse across all five schemes.", read_status: false },
      { user_id: studentUserId, title: "Document needs attention", message: "Your income certificate shows a different amount from your profile. Upload a corrected copy or request manual review.", read_status: false },
      { user_id: studentUserId, title: "Application under verification", message: "Your Post-Matric application has moved to institution verification.", read_status: true },
    ]);
  }

  // --- synthetic cohort ----------------------------------------------
  const cohort = Array.from({ length: 36 }, (_, i) => {
    const s = pick(STATES, i);
    return {
      full_name: `${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
      email: `demo.student${i + 1}@tribalink.demo`,
      phone: `98765${String(10000 + i).slice(-5)}`,
      dob: `200${i % 6}-0${(i % 9) + 1}-1${i % 9}`,
      gender: i % 2 === 0 ? "female" : "male",
      state: s.state,
      district: pick(s.districts, i),
      tribe: s.tribe,
      st_status: true,
      pvtg_status: i % 9 === 0,
      institution: `${pick(INSTITUTIONS, i)}, ${pick(s.districts, i)}`,
      course: pick(COURSES, i),
      degree_level: pick(LEVELS, i),
      year_of_study: (i % 3) + 1,
      academic_score: 52 + ((i * 7) % 45),
      annual_income: 48000 + ((i * 13000) % 260000),
      dbt_enabled: i % 5 !== 0,
      identity_verified: i % 4 !== 0,
      is_demo: true,
    };
  });
  const { data: inserted } = await supabaseAdmin.from("student_profiles").insert(cohort).select("id");

  const rows = inserted ?? [];
  if (rows.length > 0 && schemeList.length > 0) {
    const apps = rows.slice(0, 30).map((r, i) => ({
      student_id: r.id,
      scheme_id: schemeFor(i)!.id,
      status: pick(STATUSES, i),
      readiness: 45 + ((i * 11) % 55),
    }));
    const { data: createdApps } = await supabaseAdmin.from("applications").insert(apps).select("id, status, scheme_id, student_id");
    const paid = (createdApps ?? []).filter((a) => ["sanctioned", "dbt_processing", "paid"].includes(a.status));
    if (paid.length > 0) {
      await supabaseAdmin.from("payments").insert(
        paid.map((a, i) => ({
          student_id: a.student_id,
          application_id: a.id,
          scheme_id: a.scheme_id,
          amount: Number(schemeFor(i)?.award_amount ?? 12000),
          status: a.status === "paid" ? "credited" : "processing",
          sanction_date: new Date(Date.now() - (i + 2) * 86400000).toISOString().slice(0, 10),
          payment_date: a.status === "paid" ? new Date(Date.now() - i * 86400000).toISOString().slice(0, 10) : null,
          transaction_reference: a.status === "paid" ? `DBT-SIM-${100000 + i}` : null,
          bank_status: a.status === "paid" ? "Credited to DBT-seeded account (simulated)" : "Bank processing (simulated)",
        })),
      );
    }
    await supabaseAdmin.from("documents").insert(
      rows.slice(0, 18).map((r, i) => ({
        student_id: r.id,
        doc_type: pick(["income_certificate", "caste_certificate", "marksheet", "bonafide"], i),
        name: pick(["Income certificate", "Scheduled Tribe certificate", "Marksheet", "Bonafide certificate"], i),
        source: pick(["upload", "digilocker", "e_district"], i),
        verification_status: i % 3 === 0 ? "deficiency" : i % 3 === 1 ? "pending" : "verified",
        extracted_data: { annual_income: 90000 + i * 4000, percentage: 55 + i } as never,
        mismatch_notes: i % 3 === 0 ? ["Value on the document does not match the student profile."] : [],
      })),
    );
  }

  const { count: gapCount } = await supabaseAdmin.from("beneficiary_gaps").select("id", { count: "exact", head: true });
  if ((gapCount ?? 0) === 0) {
    await supabaseAdmin.from("beneficiary_gaps").insert(
      Array.from({ length: 24 }, (_, i) => {
        const s = pick(STATES, i + 2);
        return {
          student_reference: `GAP-${2026}-${1000 + i}`,
          name: `${pick(FIRST, i + 5)} ${pick(LAST, i)}`,
          state: s.state,
          district: pick(s.districts, i + 1),
          institution: `${pick(INSTITUTIONS, i + 2)}, ${pick(s.districts, i + 1)}`,
          course: pick(COURSES, i + 1),
          potential_scheme: pick(schemeList.map((x) => x.short_name ?? "Post-Matric"), i),
          confidence: 55 + ((i * 7) % 40),
          reasons: [
            "Enrolled in a recognised institution but no scholarship application found",
            i % 2 === 0 ? "Household income appears to be within the scheme ceiling" : "Scheduled Tribe status recorded in school records",
          ],
          data_sources: ["UDISE+ (mock)", "AISHE (mock)", "State welfare register (mock)"],
          status: i % 4 === 0 ? "contacted" : "identified",
        };
      }),
    );
  }

  await supabaseAdmin.from("audit_logs").insert({
    action: "seed_demo_data",
    entity: "system",
    actor_name: "System",
    metadata: { students: rows.length, note: "Synthetic prototype dataset loaded" } as never,
  });

  return { seeded: true, message: `Loaded ${rows.length + 1} synthetic students, applications, documents, payments and outreach records.` };
});
