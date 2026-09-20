/**
 * TRIBALINK — Intelligence layer (pure, deterministic, explainable).
 *
 * Every function here returns not just a result but the reasoning behind it.
 * Nothing in this module auto-rejects a student: the worst outcome any check
 * can produce is "manual review required" for a human officer to decide.
 */

export type CheckState = "pass" | "warn" | "fail";

export interface Check {
  label: string;
  state: CheckState;
  detail: string;
}

export interface StudentLike {
  id?: string;
  full_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  tribe?: string | null;
  st_status?: boolean | null;
  pvtg_status?: boolean | null;
  identity_verified?: boolean | null;
  annual_income?: number | null;
  parent_name?: string | null;
  institution?: string | null;
  aishe_code?: string | null;
  course?: string | null;
  degree_level?: string | null;
  year_of_study?: number | null;
  enrollment_no?: string | null;
  academic_score?: number | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  account_number_masked?: string | null;
  ifsc?: string | null;
  dbt_enabled?: boolean | null;
  phone?: string | null;
  email?: string | null;
}

export interface SchemeRules {
  max_income?: number | null;
  levels?: string[];
  min_score?: number;
  requires_st?: boolean;
  requires_passport?: boolean;
  requires_admission_proof?: boolean;
  one_benefit_only?: boolean;
  notes?: string;
}

export interface SchemeLike {
  id: string;
  name: string;
  short_name: string;
  description: string;
  target: string;
  eligibility_rules: SchemeRules | null;
  required_documents: string[];
  award_amount?: number | null;
  deadline?: string | null;
  status: string;
  version?: number | null;
  effective_date?: string | null;
}

export interface DocumentLike {
  doc_type: string;
  verification_status: string;
  mismatch_notes?: string[] | null;
  extracted_data?: Record<string, unknown> | null;
}

export interface ApplicationLike {
  id: string;
  scheme_id: string;
  status: string;
}

export const DEGREE_LEVELS = [
  { value: "school", label: "School (Class IX–X)" },
  { value: "higher_secondary", label: "Higher Secondary (Class XI–XII)" },
  { value: "ug", label: "Undergraduate" },
  { value: "pg", label: "Postgraduate" },
  { value: "mphil", label: "M.Phil" },
  { value: "phd", label: "Ph.D" },
] as const;

export const DOCUMENT_TYPES = [
  "ST Certificate",
  "Income Certificate",
  "Aadhaar/Identity Proof",
  "Academic Marksheet",
  "Bonafide Certificate",
  "Institution Certificate",
  "Bank Passbook",
  "Disability Certificate",
  "Admission Proof",
  "Passport",
  "Other Scheme Document",
] as const;

export const APPLICATION_STAGES = [
  "submitted",
  "under_verification",
  "deficiency",
  "resubmission_required",
  "sanctioned",
  "dbt_processing",
  "paid",
  "closed",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  submitted: "Application Submitted",
  under_verification: "Under Verification",
  institution_verification: "Institution Verification",
  document_verification: "Document Verification",
  ministry_verification: "Ministry Verification",
  deficiency: "Deficiency Raised",
  resubmission_required: "Resubmission Required",
  sanctioned: "Sanctioned",
  dbt_processing: "DBT Processing",
  paid: "Payment Credited",
  closed: "Closed",
};

export const INR = (n: number | null | undefined) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

export function rulesOf(scheme: SchemeLike): SchemeRules {
  return (scheme.eligibility_rules ?? {}) as SchemeRules;
}

/* ------------------------------------------------------------------ */
/* 1. Profile completion                                               */
/* ------------------------------------------------------------------ */

const PROFILE_FIELDS: (keyof StudentLike)[] = [
  "full_name",
  "dob",
  "gender",
  "phone",
  "email",
  "state",
  "district",
  "tribe",
  "institution",
  "course",
  "degree_level",
  "year_of_study",
  "enrollment_no",
  "academic_score",
  "aishe_code",
  "annual_income",
  "parent_name",
  "bank_account_name",
  "bank_name",
  "account_number_masked",
  "ifsc",
];

export function profileCompletion(p: StudentLike | null | undefined) {
  if (!p) return { percent: 0, missing: PROFILE_FIELDS as string[] };
  const missing = PROFILE_FIELDS.filter((f) => {
    const v = p[f];
    return v === null || v === undefined || v === "";
  });
  const percent = Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100);
  return { percent, missing: missing as string[] };
}

/* ------------------------------------------------------------------ */
/* 2. Eligibility intelligence                                         */
/* ------------------------------------------------------------------ */

export type EligibilityStatus = "eligible" | "potential" | "ineligible";

export interface EligibilityResult {
  status: EligibilityStatus;
  label: string;
  checks: Check[];
  summary: string;
}

export function evaluateEligibility(
  scheme: SchemeLike,
  student: StudentLike | null,
  docs: DocumentLike[] = [],
  applications: ApplicationLike[] = [],
): EligibilityResult {
  const r = rulesOf(scheme);
  const checks: Check[] = [];

  if (!student) {
    return {
      status: "potential",
      label: "Complete your profile to check eligibility",
      summary: "TRIBALINK needs your unified profile before it can evaluate this scheme.",
      checks: [{ label: "Student profile", state: "warn", detail: "No profile information found yet." }],
    };
  }

  // ST status
  if (r.requires_st !== false) {
    const stDoc = docs.find((d) => d.doc_type === "ST Certificate");
    if (student.st_status && stDoc?.verification_status === "verified") {
      checks.push({ label: "ST status", state: "pass", detail: "ST status declared and ST certificate verified." });
    } else if (student.st_status && stDoc) {
      checks.push({
        label: "ST status",
        state: "warn",
        detail: `ST status declared; ST certificate is ${stDoc.verification_status}.`,
      });
    } else if (student.st_status) {
      checks.push({ label: "ST status", state: "warn", detail: "ST status declared but no ST certificate uploaded." });
    } else {
      checks.push({
        label: "ST status",
        state: "fail",
        detail: "This scheme is reserved for Scheduled Tribe students and your profile does not declare ST status.",
      });
    }
  }

  // PVTG (informational priority)
  if (student.pvtg_status) {
    checks.push({
      label: "PVTG status",
      state: "pass",
      detail: "Declared as belonging to a Particularly Vulnerable Tribal Group — priority consideration.",
    });
  }

  // Income
  if (r.max_income) {
    const income = student.annual_income;
    if (income === null || income === undefined) {
      checks.push({ label: "Family income", state: "warn", detail: "Annual family income is not recorded in your profile." });
    } else if (income <= r.max_income) {
      checks.push({
        label: "Family income",
        state: "pass",
        detail: `${INR(income)} is within the configured limit of ${INR(r.max_income)}.`,
      });
    } else {
      checks.push({
        label: "Family income",
        state: "fail",
        detail: `${INR(income)} exceeds the configured limit of ${INR(r.max_income)} for this scheme.`,
      });
    }
  } else {
    checks.push({ label: "Family income", state: "pass", detail: "No income ceiling configured for this scheme." });
  }

  // Academic level
  if (r.levels?.length) {
    const level = student.degree_level ?? "";
    const labels = r.levels
      .map((l) => DEGREE_LEVELS.find((d) => d.value === l)?.label ?? l)
      .join(", ");
    if (!level) {
      checks.push({ label: "Academic level", state: "warn", detail: `Your study level is not recorded. This scheme covers: ${labels}.` });
    } else if (r.levels.includes(level)) {
      checks.push({ label: "Academic level", state: "pass", detail: `Your study level matches this scheme (${labels}).` });
    } else {
      checks.push({ label: "Academic level", state: "fail", detail: `This scheme covers ${labels}, which does not match your current level.` });
    }
  }

  // Academic performance
  if (r.min_score) {
    const score = student.academic_score;
    if (score === null || score === undefined) {
      checks.push({ label: "Academic performance", state: "warn", detail: "No academic percentage/CGPA recorded." });
    } else if (score >= r.min_score) {
      checks.push({ label: "Academic performance", state: "pass", detail: `${score}% meets the configured minimum of ${r.min_score}%.` });
    } else {
      checks.push({ label: "Academic performance", state: "fail", detail: `${score}% is below the configured minimum of ${r.min_score}%.` });
    }
  }

  // Institution
  if (student.institution) {
    checks.push({
      label: "Institution",
      state: student.aishe_code ? "pass" : "warn",
      detail: student.aishe_code
        ? `${student.institution} (AISHE/UDISE reference ${student.aishe_code}) recorded.`
        : `${student.institution} recorded, but no AISHE/UDISE reference for cross-verification.`,
    });
  } else {
    checks.push({ label: "Institution", state: "warn", detail: "No institution recorded in your profile." });
  }

  // Bank / DBT readiness
  if (student.account_number_masked && student.ifsc) {
    checks.push({
      label: "Bank & DBT",
      state: student.dbt_enabled ? "pass" : "warn",
      detail: student.dbt_enabled
        ? "Bank account recorded and DBT seeding confirmed."
        : "Bank account recorded but DBT seeding is not confirmed yet.",
    });
  } else {
    checks.push({ label: "Bank & DBT", state: "warn", detail: "Bank details are incomplete — required before disbursement." });
  }

  // Scheme-specific documents
  if (r.requires_passport) {
    const has = docs.some((d) => d.doc_type === "Passport");
    checks.push({
      label: "Passport",
      state: has ? "pass" : "warn",
      detail: has ? "Passport available in your document wallet." : "Overseas study requires a valid passport.",
    });
  }
  if (r.requires_admission_proof) {
    const has = docs.some((d) => d.doc_type === "Admission Proof");
    checks.push({
      label: "Admission proof",
      state: has ? "pass" : "warn",
      detail: has ? "Admission proof available." : "Admission proof for the notified institution is required.",
    });
  }

  // Existing benefit
  const conflict = existingBenefit(applications, scheme.id);
  if (conflict.hasConflict) {
    checks.push({
      label: "Existing benefit",
      state: r.one_benefit_only ? "warn" : "warn",
      detail: conflict.message,
    });
  } else {
    checks.push({ label: "Existing benefit", state: "pass", detail: "No conflicting active scholarship or fellowship found." });
  }

  // Scheme window
  if (scheme.status !== "open") {
    checks.push({ label: "Application window", state: "warn", detail: "The application window for this scheme is currently closed." });
  }

  const hasFail = checks.some((c) => c.state === "fail");
  const hasWarn = checks.some((c) => c.state === "warn");
  const status: EligibilityStatus = hasFail ? "ineligible" : hasWarn ? "potential" : "eligible";

  return {
    status,
    label:
      status === "eligible"
        ? "Eligible"
        : status === "potential"
          ? "Potentially Eligible — Additional Verification Required"
          : "Not Eligible under the configured rules",
    summary:
      status === "eligible"
        ? `You satisfy every configured rule for ${scheme.short_name}.`
        : status === "potential"
          ? `${checks.filter((c) => c.state === "warn").length} item(s) need verification before ${scheme.short_name} can be confirmed.`
          : `${checks.filter((c) => c.state === "fail").length} configured rule(s) are not met. A nodal officer can still review your case.`,
    checks,
  };
}

/* ------------------------------------------------------------------ */
/* 3. One-scholarship-at-a-time check                                  */
/* ------------------------------------------------------------------ */

const ACTIVE_STATUSES = ["submitted", "under_verification", "deficiency", "resubmission_required", "sanctioned", "dbt_processing", "paid"];

export function existingBenefit(applications: ApplicationLike[], schemeId: string) {
  const conflicts = applications.filter((a) => a.scheme_id !== schemeId && ACTIVE_STATUSES.includes(a.status));
  const same = applications.find((a) => a.scheme_id === schemeId && ACTIVE_STATUSES.includes(a.status));
  if (same) {
    return {
      hasConflict: true,
      blocking: true,
      message: `You already have an application for this scheme with status "${STAGE_LABELS[same.status] ?? same.status}".`,
    };
  }
  if (conflicts.length) {
    return {
      hasConflict: true,
      blocking: false,
      message: `You currently have an active application under ${conflicts.length} other scheme(s). According to the configured prototype rule, another scholarship/fellowship application may require verification before proceeding.`,
    };
  }
  return { hasConflict: false, blocking: false, message: "No active scholarship or fellowship detected." };
}

/* ------------------------------------------------------------------ */
/* 4. Verification intelligence                                        */
/* ------------------------------------------------------------------ */

export interface VerificationResult {
  score: number;
  checks: Check[];
}

export function runVerification(student: StudentLike | null, docs: DocumentLike[]): VerificationResult {
  const checks: Check[] = [];
  const doc = (t: string) => docs.find((d) => d.doc_type === t);
  const docState = (t: string): CheckState => {
    const d = doc(t);
    if (!d) return "warn";
    if (d.verification_status === "verified") return "pass";
    if (d.verification_status === "deficiency") return "fail";
    return "warn";
  };

  checks.push({
    label: "Identity",
    state: student?.identity_verified ? "pass" : docState("Aadhaar/Identity Proof"),
    detail: student?.identity_verified
      ? "Identity matched against the simulated UIDAI response (prototype)."
      : doc("Aadhaar/Identity Proof")
        ? "Identity document present; cross-check pending."
        : "No identity proof available in the document wallet.",
  });

  checks.push({
    label: "ST status",
    state: student?.st_status ? docState("ST Certificate") : "fail",
    detail: !student?.st_status
      ? "ST status is not declared in the profile."
      : doc("ST Certificate")
        ? `ST certificate is ${doc("ST Certificate")!.verification_status}.`
        : "ST certificate not uploaded.",
  });

  const incomeDoc = doc("Income Certificate");
  const incomeMismatch = incomeDoc?.mismatch_notes?.length ? incomeDoc.mismatch_notes[0] : null;
  checks.push({
    label: "Income",
    state: incomeMismatch ? "fail" : docState("Income Certificate"),
    detail: incomeMismatch ?? (incomeDoc ? `Income certificate is ${incomeDoc.verification_status}.` : "Income certificate not uploaded."),
  });

  checks.push({
    label: "Academic record",
    state: docState("Academic Marksheet"),
    detail: doc("Academic Marksheet")
      ? `Marksheet is ${doc("Academic Marksheet")!.verification_status}; profile score recorded as ${student?.academic_score ?? "—"}%.`
      : "No academic marksheet uploaded.",
  });

  checks.push({
    label: "Institution",
    state: student?.aishe_code ? "pass" : student?.institution ? "warn" : "fail",
    detail: student?.aishe_code
      ? `${student.institution} matched against the simulated AISHE/UDISE+ registry (prototype).`
      : student?.institution
        ? "Institution recorded but no AISHE/UDISE+ reference for cross-verification."
        : "Institution details missing.",
  });

  checks.push({
    label: "Bank / DBT",
    state: student?.dbt_enabled ? "pass" : student?.account_number_masked ? "warn" : "fail",
    detail: student?.dbt_enabled
      ? `${student.bank_name ?? "Bank"} account ${student.account_number_masked} is DBT-seeded (simulated).`
      : student?.account_number_masked
        ? "Bank account recorded but DBT seeding is not confirmed."
        : "Bank details not provided.",
  });

  const weight = (s: CheckState) => (s === "pass" ? 1 : s === "warn" ? 0.5 : 0);
  const score = Math.round((checks.reduce((a, c) => a + weight(c.state), 0) / checks.length) * 100);
  return { score, checks };
}

/* ------------------------------------------------------------------ */
/* 5. Application readiness                                            */
/* ------------------------------------------------------------------ */

export interface ReadinessItem {
  label: string;
  state: CheckState;
  detail: string;
  action?: { label: string; to: string };
}

export function applicationReadiness(
  scheme: SchemeLike,
  student: StudentLike | null,
  docs: DocumentLike[],
  applications: ApplicationLike[],
): { percent: number; items: ReadinessItem[] } {
  const completion = profileCompletion(student);
  const elig = evaluateEligibility(scheme, student, docs, applications);
  const ver = runVerification(student, docs);
  const required = scheme.required_documents ?? [];
  const missingDocs = required.filter((t) => !docs.some((d) => d.doc_type === t));
  const benefit = existingBenefit(applications, scheme.id);

  const items: ReadinessItem[] = [
    {
      label: "Profile",
      state: completion.percent >= 90 ? "pass" : completion.percent >= 60 ? "warn" : "fail",
      detail: `Unified profile is ${completion.percent}% complete.`,
      action: { label: "Complete profile", to: "/student/profile" },
    },
    {
      label: "Eligibility",
      state: elig.status === "eligible" ? "pass" : elig.status === "potential" ? "warn" : "fail",
      detail: elig.summary,
      action: { label: "View eligibility", to: "/student/scholarships" },
    },
    {
      label: "Documents",
      state: missingDocs.length === 0 ? "pass" : missingDocs.length <= 2 ? "warn" : "fail",
      detail: missingDocs.length ? `Missing: ${missingDocs.join(", ")}.` : "All scheme documents available in your wallet.",
      action: { label: "Open document wallet", to: "/student/documents" },
    },
    {
      label: "Verification",
      state: ver.score >= 90 ? "pass" : ver.score >= 60 ? "warn" : "fail",
      detail: `Unified verification score is ${ver.score}%.`,
      action: { label: "Run verification", to: "/student/verification" },
    },
    {
      label: "Bank / DBT",
      state: student?.dbt_enabled ? "pass" : student?.account_number_masked ? "warn" : "fail",
      detail: student?.dbt_enabled ? "DBT-seeded account on record." : "Bank/DBT confirmation pending.",
      action: { label: "Update bank details", to: "/student/profile" },
    },
    {
      label: "Existing benefit",
      state: benefit.blocking ? "fail" : benefit.hasConflict ? "warn" : "pass",
      detail: benefit.message,
      action: { label: "View applications", to: "/student/applications" },
    },
  ];

  const weight = (s: CheckState) => (s === "pass" ? 1 : s === "warn" ? 0.5 : 0);
  const percent = Math.round((items.reduce((a, i) => a + weight(i.state), 0) / items.length) * 100);
  return { percent, items };
}

/* ------------------------------------------------------------------ */
/* 6. Document intelligence (prototype OCR)                            */
/* ------------------------------------------------------------------ */

export interface OcrResult {
  detectedType: string;
  fields: Record<string, string>;
  mismatches: string[];
  confidence: number;
}

/**
 * Prototype document processing. A deterministic extractor stands in for a
 * real OCR pipeline: it derives plausible field values from the file name and
 * the unified profile, then cross-checks them against the profile so the
 * mismatch-detection behaviour is genuinely exercised in the demo.
 */
export function simulateOcr(fileName: string, declaredType: string, student: StudentLike | null): OcrResult {
  const lower = fileName.toLowerCase();
  const guess =
    (DOCUMENT_TYPES as readonly string[]).find((t) => lower.includes(t.split("/")[0]!.split(" ")[0]!.toLowerCase())) ??
    declaredType;

  const fields: Record<string, string> = {};
  const mismatches: string[] = [];
  const issued = new Date();
  issued.setMonth(issued.getMonth() - 4);
  fields["Issued on"] = issued.toISOString().slice(0, 10);
  fields["Holder name"] = student?.full_name ?? "—";

  const seed = [...fileName].reduce((a, c) => a + c.charCodeAt(0), 0);

  if (declaredType === "Income Certificate") {
    const profileIncome = student?.annual_income ?? 240000;
    // Deterministic variance so some demo uploads legitimately mismatch.
    const drift = seed % 3 === 0 ? -60000 : 0;
    const extracted = Math.max(0, profileIncome + drift);
    fields["Annual income"] = INR(extracted);
    fields["Issuing authority"] = "Tahsildar, e-District (simulated)";
    if (drift !== 0) {
      mismatches.push(
        `Income mismatch detected: certificate states ${INR(extracted)} while the profile records ${INR(profileIncome)} (difference ${INR(Math.abs(drift))}).`,
      );
    }
  } else if (declaredType === "ST Certificate") {
    fields["Community"] = student?.tribe ?? "Scheduled Tribe";
    fields["Issuing authority"] = "Revenue Department, e-District (simulated)";
    fields["Certificate no."] = `ST/${(seed % 9000) + 1000}/PROTO`;
  } else if (declaredType === "Academic Marksheet") {
    const profileScore = student?.academic_score ?? 72;
    const drift = seed % 4 === 0 ? -8 : 0;
    fields["Percentage"] = `${profileScore + drift}%`;
    fields["Board / University"] = student?.institution ?? "—";
    if (drift !== 0) {
      mismatches.push(
        `Academic mismatch detected: marksheet shows ${profileScore + drift}% while the profile records ${profileScore}%.`,
      );
    }
  } else if (declaredType === "Bank Passbook") {
    fields["Account holder"] = student?.bank_account_name ?? student?.full_name ?? "—";
    fields["Account number"] = student?.account_number_masked ?? "XXXXXX" + ((seed % 9000) + 1000);
    fields["IFSC"] = student?.ifsc ?? "SBIN0PROTO1";
  } else if (declaredType === "Aadhaar/Identity Proof") {
    fields["Identity number"] = "XXXX XXXX " + ((seed % 9000) + 1000);
    fields["Name on document"] = student?.full_name ?? "—";
  } else {
    fields["Document reference"] = `DOC/${(seed % 9000) + 1000}/PROTO`;
  }

  return { detectedType: guess, fields, mismatches, confidence: 0.82 + ((seed % 15) / 100) };
}

/* ------------------------------------------------------------------ */
/* 7. JAGO rule-based fallback (works without any AI key)              */
/* ------------------------------------------------------------------ */

export interface JagoContext {
  student: StudentLike | null;
  schemes: SchemeLike[];
  docs: DocumentLike[];
  applications: (ApplicationLike & { scheme_name?: string })[];
  payments: { scheme_id?: string | null; amount: number; status: string }[];
  eligibility: { scheme: string; status: EligibilityStatus; summary: string }[];
}

const T = {
  en: {
    greeting: (n: string) => `Namaste ${n}. I am JAGO, your TRIBALINK scholarship assistant.`,
    noApps: "You have not submitted any scholarship application yet. Open Scholarships to check which schemes you qualify for.",
    source: "Source",
  },
  hi: {
    greeting: (n: string) => `नमस्ते ${n}। मैं जागो हूँ, आपका ट्राइबालिंक छात्रवृत्ति सहायक।`,
    noApps: "आपने अभी तक कोई छात्रवृत्ति आवेदन जमा नहीं किया है। पात्र योजनाएँ देखने के लिए स्कॉलरशिप खोलें।",
    source: "स्रोत",
  },
  te: {
    greeting: (n: string) => `నమస్తే ${n}. నేను జాగో, మీ ట్రైబాలింక్ స్కాలర్‌షిప్ సహాయకుడిని.`,
    noApps: "మీరు ఇంకా ఏ స్కాలర్‌షిప్ దరఖాస్తును సమర్పించలేదు. అర్హత ఉన్న పథకాలను చూడటానికి స్కాలర్‌షిప్‌లను తెరవండి.",
    source: "మూలం",
  },
} as const;

export type Lang = keyof typeof T;

export function jagoFallback(question: string, ctx: JagoContext, lang: Lang = "en"): string {
  const q = question.toLowerCase();
  const name = ctx.student?.full_name?.split(" ")[0] ?? "student";
  const t = T[lang];
  const app = ctx.applications[0];

  const line = (s: string) => s;

  if (/status|pending|where|track|sanction|कहाँ|स्थिति|स्థితి/.test(q)) {
    if (!app) return t.noApps;
    const pay = ctx.payments.find((p) => p.scheme_id === app.scheme_id);
    const defs = ctx.docs.filter((d) => d.verification_status !== "verified");
    return line(
      `Your ${app.scheme_name ?? app.scheme_id} application is currently at "${STAGE_LABELS[app.status] ?? app.status}".` +
        (defs.length
          ? ` ${defs.length} document(s) still need attention: ${defs.map((d) => d.doc_type).join(", ")}. You can replace them from the Documents section.`
          : " All submitted documents are verified.") +
        (pay ? ` A sanction of ${INR(pay.amount)} is recorded with DBT status "${pay.status}".` : ""),
    );
  }

  if (/eligib|qualify|apply for|which scholarship|पात्र|అర్హ/.test(q)) {
    const ok = ctx.eligibility.filter((e) => e.status === "eligible");
    const maybe = ctx.eligibility.filter((e) => e.status === "potential");
    if (!ctx.eligibility.length) return "Complete your TRIBALINK profile first — then I can evaluate all five schemes for you.";
    return line(
      `Based on your profile: ${ok.length ? `you are eligible for ${ok.map((e) => e.scheme).join(", ")}. ` : ""}` +
        `${maybe.length ? `You are potentially eligible for ${maybe.map((e) => e.scheme).join(", ")} — these need additional verification. ` : ""}` +
        `Open Scholarships for the full rule-by-rule explanation.`,
    );
  }

  if (/document|upload|certificate|दस्तावेज|పత్ర/.test(q)) {
    const missing = ctx.schemes
      .flatMap((s) => s.required_documents)
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .filter((d) => !ctx.docs.some((x) => x.doc_type === d));
    return line(
      `Your wallet holds ${ctx.docs.length} document(s), ${ctx.docs.filter((d) => d.verification_status === "verified").length} verified.` +
        (missing.length ? ` Commonly required documents you have not added yet: ${missing.slice(0, 5).join(", ")}.` : " Nothing is missing across the five schemes.") +
        ` ${t.source}: TRIBALINK scheme rules (required_documents).`,
    );
  }

  if (/dbt|payment|money|credit|भुगतान|చెల్లింపు/.test(q)) {
    if (!ctx.payments.length) return "No sanction or DBT transaction is recorded on your account yet.";
    const p = ctx.payments[0]!;
    return line(
      `DBT means Direct Benefit Transfer — the sanctioned amount is credited straight to your DBT-seeded bank account. Your latest record: ${INR(p.amount)}, status "${p.status}". All payment data in this prototype is simulated.`,
    );
  }

  if (/flag|mismatch|why.*reject|deficien/.test(q)) {
    const flagged = ctx.docs.filter((d) => (d.mismatch_notes?.length ?? 0) > 0 || d.verification_status === "deficiency");
    if (!flagged.length) return "None of your documents are currently flagged.";
    return flagged
      .map((d) => `${d.doc_type}: ${d.mismatch_notes?.[0] ?? "flagged for manual review"}`)
      .join(" ") + " A nodal officer makes the final decision — nothing is auto-rejected.";
  }

  if (/next|what should i do|missing/.test(q)) {
    const c = profileCompletion(ctx.student);
    if (c.percent < 100) return `Next step: complete your profile (currently ${c.percent}%). Missing fields: ${c.missing.slice(0, 6).join(", ")}.`;
    if (!app) return "Your profile is complete. Next step: open Scholarships and submit an application for a scheme you are eligible for.";
    return `Your application is at "${STAGE_LABELS[app.status] ?? app.status}". Watch Notifications for the next officer action.`;
  }

  if (/who are you|hello|hi|namaste|नमस्ते/.test(q)) {
    return `${t.greeting(name)} Ask me about eligibility, documents, verification, application status or DBT.`;
  }

  const s = ctx.schemes.find((x) => q.includes(x.short_name.toLowerCase()) || q.includes(x.name.toLowerCase().slice(0, 12)));
  if (s) {
    const r = rulesOf(s);
    return `${s.name}: ${s.description} Target: ${s.target}. Configured rules — income ceiling ${r.max_income ? INR(r.max_income) : "not applicable"}, minimum academic score ${r.min_score ?? 0}%. Required documents: ${s.required_documents.join(", ")}. ${t.source}: TRIBALINK scheme registry (version ${1}).`;
  }

  return `${t.greeting(name)} I can answer questions about the five tribal scholarship schemes, your eligibility, your documents, verification, application status and DBT. Try: "What is pending in my application?"`;
}
