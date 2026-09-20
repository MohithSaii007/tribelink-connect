import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  applicationReadiness,
  evaluateEligibility,
  existingBenefit,
  jagoFallback,
  runVerification,
  simulateOcr,
  type DocumentLike,
  type JagoContext,
  type Lang,
  type SchemeLike,
  type StudentLike,
} from "./intel";

/* ------------------------------------------------------------------ */
/* Public (anon) reads                                                 */
/* ------------------------------------------------------------------ */

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublicSchemes = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("scholarship_schemes")
    .select("*")
    .order("award_amount", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SchemeLike[];
});

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

async function audit(
  supabase: ReturnType<typeof publicClient>,
  userId: string,
  actor: string,
  action: string,
  entity: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({ user_id: userId, actor_name: actor, action, entity, metadata: metadata as never });
}

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: student }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const role = roleList.includes("admin") ? "admin" : roleList.includes("officer") ? "officer" : "student";
    return { userId, profile, role, student };
  });

/* ------------------------------------------------------------------ */
/* Student workspace (single read used across the student app)         */
/* ------------------------------------------------------------------ */

export const getStudentWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // One parallel round-trip for everything that only needs the user id.
    const [{ data: profile }, studentRes, { data: schemes }, notifRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("scholarship_schemes").select("*").order("award_amount"),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);

    let student = studentRes.data;

    if (!student) {
      const { data: created } = await supabase
        .from("student_profiles")
        .insert({
          user_id: userId,
          full_name: profile?.full_name || "New Student",
          email: profile?.email ?? null,
          phone: profile?.phone ?? null,
        })
        .select("*")
        .maybeSingle();
      student = created;
    }

    const sid = student?.id;
    const [docsRes, appsRes, paysRes] = await Promise.all([
      sid ? supabase.from("documents").select("*").eq("student_id", sid).order("created_at", { ascending: false }) : { data: [] },
      sid ? supabase.from("applications").select("*").eq("student_id", sid).order("submitted_at", { ascending: false }) : { data: [] },
      sid ? supabase.from("payments").select("*").eq("student_id", sid).order("created_at", { ascending: false }) : { data: [] },
    ]);

    const appIds = (appsRes.data ?? []).map((a) => a.id);
    const eventsRes = appIds.length
      ? await supabase.from("application_events").select("*").in("application_id", appIds).order("created_at", { ascending: true })
      : { data: [] };

    const docs = (docsRes.data ?? []) as unknown as DocumentLike[];
    const apps = appsRes.data ?? [];
    const schemeList = (schemes ?? []) as unknown as SchemeLike[];

    const eligibility = schemeList.map((s) => ({
      scheme_id: s.id,
      ...evaluateEligibility(s, student as StudentLike, docs, apps as never),
    }));

    const verification = runVerification(student as StudentLike, docs);

    return {
      profile,
      student,
      schemes: schemeList,
      documents: docsRes.data ?? [],
      applications: apps,
      events: eventsRes.data ?? [],
      payments: paysRes.data ?? [],
      notifications: notifRes.data ?? [],
      eligibility,
      verification,
    };
  });

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const ProfileInput = z.object({
  full_name: z.string().min(2).max(120),
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  state: z.string().max(80).nullable().optional(),
  district: z.string().max(80).nullable().optional(),
  tribe: z.string().max(80).nullable().optional(),
  st_status: z.boolean().optional(),
  pvtg_status: z.boolean().optional(),
  annual_income: z.number().min(0).max(100000000).nullable().optional(),
  parent_name: z.string().max(120).nullable().optional(),
  parent_occupation: z.string().max(120).nullable().optional(),
  institution: z.string().max(160).nullable().optional(),
  aishe_code: z.string().max(40).nullable().optional(),
  course: z.string().max(120).nullable().optional(),
  degree_level: z.string().max(40).nullable().optional(),
  year_of_study: z.number().int().min(1).max(10).nullable().optional(),
  enrollment_no: z.string().max(60).nullable().optional(),
  academic_score: z.number().min(0).max(100).nullable().optional(),
  bank_account_name: z.string().max(120).nullable().optional(),
  bank_name: z.string().max(120).nullable().optional(),
  account_number_masked: z.string().max(40).nullable().optional(),
  ifsc: z.string().max(20).nullable().optional(),
  dbt_enabled: z.boolean().optional(),
});

export const updateStudentProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(data)) if (v !== undefined) patch[k] = v;
    const { data: row, error } = await supabase
      .from("student_profiles")
      .update(patch as never)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await audit(supabase as never, userId, data.full_name, "profile.updated", "student_profiles", { fields: Object.keys(data) });
    return row;
  });

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

const DocInput = z.object({
  doc_type: z.string().min(2).max(60),
  name: z.string().min(1).max(160),
  source: z.string().max(40).default("upload"),
  size: z.number().max(5 * 1024 * 1024).optional(),
  mime: z.string().max(80).optional(),
});

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export const addDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DocInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.mime && !ALLOWED_MIME.includes(data.mime)) {
      throw new Error("Only PDF, JPG, PNG or WEBP files up to 5 MB are accepted.");
    }
    const { data: student } = await supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (!student) throw new Error("Student profile not found.");

    const ocr = simulateOcr(data.name, data.doc_type, student as StudentLike);
    const status = ocr.mismatches.length ? "deficiency" : "verified";

    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        student_id: student.id,
        doc_type: data.doc_type,
        name: data.name.slice(0, 160),
        source: data.source,
        extracted_data: { ...ocr.fields, _detected_type: ocr.detectedType, _confidence: ocr.confidence, _mode: "prototype" } as never,
        mismatch_notes: ocr.mismatches,
        verification_status: status,
      })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("verification_records").insert({
      student_id: student.id,
      verification_type: data.doc_type,
      status: status === "verified" ? "verified" : "mismatch",
      source: data.source === "digilocker" ? "DigiLocker (simulated)" : "Document upload",
      remarks: ocr.mismatches[0] ?? "Extracted fields matched the unified profile.",
    });

    await supabase.from("notifications").insert({
      user_id: userId,
      student_id: student.id,
      title: ocr.mismatches.length ? "Document flagged for review" : "Document verified",
      message: ocr.mismatches[0] ?? `${data.doc_type} was processed and matched your profile.`,
      type: ocr.mismatches.length ? "deficiency" : "verification",
    });

    await audit(supabase as never, userId, student.full_name, "document.uploaded", "documents", { doc_type: data.doc_type });
    return { document: row, ocr };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const requestManualReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid(), note: z.string().max(400).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase.from("documents").select("*").eq("id", data.documentId).maybeSingle();
    if (!doc) throw new Error("Document not found.");
    await supabase.from("documents").update({ verification_status: "manual_review" }).eq("id", data.documentId);
    await supabase.from("verification_records").insert({
      student_id: doc.student_id,
      verification_type: doc.doc_type,
      status: "manual_review",
      source: "Student request",
      remarks: data.note ?? "Student requested manual review of a flagged document.",
    });
    await audit(supabase as never, userId, "", "verification.manual_review_requested", "documents", { id: data.documentId });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ schemeId: z.string().min(2).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: student } = await supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (!student) throw new Error("Complete your profile before applying.");
    const { data: scheme } = await supabase.from("scholarship_schemes").select("*").eq("id", data.schemeId).maybeSingle();
    if (!scheme) throw new Error("Scheme not found.");

    const { data: docs } = await supabase.from("documents").select("*").eq("student_id", student.id);
    const { data: apps } = await supabase.from("applications").select("*").eq("student_id", student.id);

    const conflict = existingBenefit((apps ?? []) as never, data.schemeId);
    if (conflict.blocking) throw new Error(conflict.message);

    const readiness = applicationReadiness(
      scheme as unknown as SchemeLike,
      student as StudentLike,
      (docs ?? []) as unknown as DocumentLike[],
      (apps ?? []) as never,
    );

    const { data: app, error } = await supabase
      .from("applications")
      .insert({ student_id: student.id, scheme_id: data.schemeId, status: "submitted", readiness: readiness.percent })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("application_events").insert([
      { application_id: app!.id, status: "submitted", note: `Application submitted through TRIBALINK with readiness ${readiness.percent}%.` },
      { application_id: app!.id, status: "under_verification", note: "Routed to the institution nodal officer for verification." },
    ]);
    await supabase.from("applications").update({ status: "under_verification" }).eq("id", app!.id);
    await supabase.from("notifications").insert({
      user_id: userId,
      student_id: student.id,
      title: "Application submitted",
      message: `Your ${scheme.short_name} application ${app!.reference_no} has been submitted and is now under verification.`,
      type: "application",
    });
    await audit(supabase as never, userId, student.full_name, "application.submitted", "applications", {
      scheme: data.schemeId,
      reference: app!.reference_no,
    });
    return app;
  });

export const getApplicationDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: app } = await supabase.from("applications").select("*").eq("id", data.id).maybeSingle();
    if (!app) throw new Error("Application not found.");
    const [{ data: events }, { data: student }, { data: scheme }, { data: docs }, { data: payments }] = await Promise.all([
      supabase.from("application_events").select("*").eq("application_id", data.id).order("created_at"),
      supabase.from("student_profiles").select("*").eq("id", app.student_id).maybeSingle(),
      supabase.from("scholarship_schemes").select("*").eq("id", app.scheme_id).maybeSingle(),
      supabase.from("documents").select("*").eq("student_id", app.student_id),
      supabase.from("payments").select("*").eq("application_id", data.id),
    ]);
    return { app, events: events ?? [], student, scheme, documents: docs ?? [], payments: payments ?? [] };
  });

/* ------------------------------------------------------------------ */
/* Verification snapshot persistence                                   */
/* ------------------------------------------------------------------ */

export const saveVerificationRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: student } = await supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (!student) throw new Error("Student profile not found.");
    const { data: docs } = await supabase.from("documents").select("*").eq("student_id", student.id);
    const result = runVerification(student as StudentLike, (docs ?? []) as unknown as DocumentLike[]);
    await supabase.from("verification_records").insert(
      result.checks.map((c) => ({
        student_id: student.id,
        verification_type: c.label,
        status: c.state === "pass" ? "verified" : c.state === "warn" ? "pending" : "mismatch",
        source: "TRIBALINK unified verification engine",
        remarks: c.detail,
      })),
    );
    await audit(supabase as never, userId, student.full_name, "verification.run", "verification_records", { score: result.score });
    return result;
  });

export const listVerificationRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: student } = await supabase.from("student_profiles").select("id").eq("user_id", userId).maybeSingle();
    if (!student) return [];
    const { data } = await supabase
      .from("verification_records")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(40);
    return data ?? [];
  });

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const markNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("notifications").update({ read_status: true }).eq("user_id", userId);
    if (data.id) q = q.eq("id", data.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* JAGO assistant                                                      */
/* ------------------------------------------------------------------ */

const LANG_NAME: Record<Lang, string> = { en: "English", hi: "Hindi", te: "Telugu" };

export const jagoChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ question: z.string().min(1).max(600), lang: z.enum(["en", "hi", "te"]).default("en") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: student } = await supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle();
    const { data: schemes } = await supabase.from("scholarship_schemes").select("*");
    const sid = student?.id;
    const [{ data: docs }, { data: apps }, { data: pays }] = await Promise.all([
      sid ? supabase.from("documents").select("*").eq("student_id", sid) : { data: [] },
      sid ? supabase.from("applications").select("*").eq("student_id", sid).order("submitted_at", { ascending: false }) : { data: [] },
      sid ? supabase.from("payments").select("*").eq("student_id", sid) : { data: [] },
    ]);

    const schemeList = (schemes ?? []) as unknown as SchemeLike[];
    const docList = (docs ?? []) as unknown as DocumentLike[];
    const appList = (apps ?? []).map((a) => ({
      ...a,
      scheme_name: schemeList.find((s) => s.id === a.scheme_id)?.short_name ?? a.scheme_id,
    }));

    const ctx: JagoContext = {
      student: student as StudentLike,
      schemes: schemeList,
      docs: docList,
      applications: appList as never,
      payments: (pays ?? []) as never,
      eligibility: schemeList.map((s) => {
        const e = evaluateEligibility(s, student as StudentLike, docList, appList as never);
        return { scheme: s.short_name, status: e.status, summary: e.summary };
      }),
    };

    const grounded = jagoFallback(data.question, ctx, data.lang);
    let answer = grounded;
    let mode: "ai" | "rules" = "rules";

    const key = process.env["LOVABLE_API_KEY"];
    if (key) {
      try {
        const knowledge = schemeList
          .map(
            (s) =>
              `SCHEME ${s.short_name} (${s.name}): ${s.description} Target: ${s.target}. Rules: ${JSON.stringify(s.eligibility_rules)}. Documents: ${s.required_documents.join(", ")}. Deadline: ${s.deadline}. Status: ${s.status}.`,
          )
          .join("\n");
        const record = JSON.stringify({
          profile: student,
          documents: docList.map((d) => ({ type: d.doc_type, status: d.verification_status, flags: d.mismatch_notes })),
          applications: appList.map((a) => ({ scheme: a.scheme_name, status: a.status, ref: (a as { reference_no?: string }).reference_no })),
          payments: pays,
          eligibility: ctx.eligibility,
        });
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: [
              {
                role: "system",
                content: `You are JAGO, the TRIBALINK scholarship assistant for tribal students in India. Answer ONLY from the KNOWLEDGE BASE and STUDENT RECORD provided. Never invent government rules, amounts or deadlines; if something is not in the knowledge base, say it is not available in TRIBALINK and suggest contacting the nodal officer. Be concise (max 120 words), warm and practical. Reply entirely in ${LANG_NAME[data.lang]}. Mention that integrations and payment data are prototype/simulated when relevant. Never say an application is rejected — only a human officer decides.\n\nKNOWLEDGE BASE:\n${knowledge}\n\nSTUDENT RECORD:\n${record}\n\nRULE-ENGINE ANSWER (authoritative facts you must stay consistent with):\n${grounded}`,
              },
              { role: "user", content: data.question },
            ],
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const text = json.choices?.[0]?.message?.content?.trim();
          if (text) {
            answer = text;
            mode = "ai";
          }
        } else if (res.status === 429) {
          answer = grounded + "\n\n(AI assistant is rate-limited right now — this answer came from the TRIBALINK rule engine.)";
        } else if (res.status === 402) {
          answer = grounded + "\n\n(AI credits are exhausted — this answer came from the TRIBALINK rule engine.)";
        }
      } catch {
        // Fall back silently to the rule engine answer.
      }
    }

    await supabase.from("chat_messages").insert([
      { user_id: userId, role: "user", message: data.question, lang: data.lang },
      { user_id: userId, role: "assistant", message: answer, lang: data.lang },
    ]);

    return { answer, mode, sources: schemeList.map((s) => s.short_name) };
  });

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(100);
    return data ?? [];
  });

export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("chat_messages").delete().eq("user_id", context.userId);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Admin / officer                                                     */
/* ------------------------------------------------------------------ */

async function assertStaff(supabase: ReturnType<typeof publicClient>, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (!roles.includes("admin") && !roles.includes("officer")) throw new Error("Forbidden: staff access only.");
  return roles.includes("admin") ? "admin" : "officer";
}

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, students, apps, payments, gaps, verifications, schemes] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase.from("student_profiles").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("beneficiary_gaps").select("*"),
      supabase.from("verification_records").select("*"),
      supabase.from("scholarship_schemes").select("*"),
    ]);

    const appRows = apps.data ?? [];
    const payRows = payments.data ?? [];
    const verRows = verifications.data ?? [];
    const studentRows = students.data ?? [];

    const byScheme = (schemes.data ?? []).map((s) => ({
      name: s.short_name,
      value: appRows.filter((a) => a.scheme_id === s.id).length,
    }));

    const statuses = ["submitted", "under_verification", "deficiency", "sanctioned", "dbt_processing", "paid"];
    const byStatus = statuses.map((st) => ({ name: st, value: appRows.filter((a) => a.status === st).length }));

    const stateMap = new Map<string, { state: string; students: number; applications: number; gaps: number }>();
    for (const s of studentRows) {
      const k = s.state ?? "Unknown";
      const e = stateMap.get(k) ?? { state: k, students: 0, applications: 0, gaps: 0 };
      e.students += 1;
      e.applications += appRows.filter((a) => a.student_id === s.id).length;
      stateMap.set(k, e);
    }
    for (const g of gaps.data ?? []) {
      const e = stateMap.get(g.state) ?? { state: g.state, students: 0, applications: 0, gaps: 0 };
      e.gaps += 1;
      stateMap.set(g.state, e);
    }

    const districtMap = new Map<string, { district: string; state: string; applications: number; gaps: number }>();
    for (const s of studentRows) {
      const k = s.district ?? "Unknown";
      const e = districtMap.get(k) ?? { district: k, state: s.state ?? "—", applications: 0, gaps: 0 };
      e.applications += appRows.filter((a) => a.student_id === s.id).length;
      districtMap.set(k, e);
    }
    for (const g of gaps.data ?? []) {
      const e = districtMap.get(g.district) ?? { district: g.district, state: g.state, applications: 0, gaps: 0 };
      e.gaps += 1;
      districtMap.set(g.district, e);
    }

    const mismatchTypes = new Map<string, number>();
    for (const v of verRows.filter((v) => v.status === "mismatch")) {
      mismatchTypes.set(v.verification_type, (mismatchTypes.get(v.verification_type) ?? 0) + 1);
    }

    return {
      kpis: {
        students: studentRows.length,
        applications: appRows.length,
        underVerification: appRows.filter((a) => ["under_verification", "submitted"].includes(a.status)).length,
        sanctioned: appRows.filter((a) => ["sanctioned", "dbt_processing", "paid"].includes(a.status)).length,
        disbursed: payRows.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0),
        gaps: (gaps.data ?? []).filter((g) => g.status !== "enrolled").length,
        mismatches: verRows.filter((v) => v.status === "mismatch").length,
      },
      byScheme,
      byStatus,
      byState: [...stateMap.values()].sort((a, b) => b.applications - a.applications),
      byDistrict: [...districtMap.values()].sort((a, b) => b.gaps - a.gaps).slice(0, 12),
      verification: {
        verified: verRows.filter((v) => v.status === "verified").length,
        pending: verRows.filter((v) => v.status === "pending").length,
        mismatch: verRows.filter((v) => v.status === "mismatch").length,
        manual: verRows.filter((v) => v.status === "manual_review").length,
        avgHours: 18,
        mismatchTypes: [...mismatchTypes.entries()].map(([name, value]) => ({ name, value })),
      },
    };
  });

export const listAdminStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, { data: students }, { data: apps }] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase.from("student_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*"),
    ]);
    return (students ?? []).map((s) => ({
      ...s,
      applications: (apps ?? []).filter((a) => a.student_id === s.id).length,
      latest_status: (apps ?? []).find((a) => a.student_id === s.id)?.status ?? null,
    }));
  });

export const listAdminApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, { data: apps }, { data: students }, { data: schemes }] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase.from("applications").select("*").order("submitted_at", { ascending: false }),
      supabase.from("student_profiles").select("id, full_name, state, district, institution, annual_income, academic_score"),
      supabase.from("scholarship_schemes").select("id, short_name"),
    ]);
    return (apps ?? []).map((a) => {
      const s = (students ?? []).find((x) => x.id === a.student_id);
      return {
        ...a,
        student_name: s?.full_name ?? "—",
        state: s?.state ?? "—",
        district: s?.district ?? "—",
        institution: s?.institution ?? "—",
        scheme_name: (schemes ?? []).find((x) => x.id === a.scheme_id)?.short_name ?? a.scheme_id,
      };
    });
  });

export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, { data: docs }, { data: students }, { data: apps }, { data: schemes }] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase
        .from("documents")
        .select("*")
        .in("verification_status", ["deficiency", "manual_review", "pending"])
        .order("created_at", { ascending: false }),
      supabase.from("student_profiles").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("scholarship_schemes").select("id, short_name"),
    ]);
    return (docs ?? []).map((d) => {
      const s = (students ?? []).find((x) => x.id === d.student_id);
      const a = (apps ?? []).find((x) => x.student_id === d.student_id);
      const notes = (d.mismatch_notes ?? []) as string[];
      return {
        id: d.id,
        student_id: d.student_id,
        student_name: s?.full_name ?? "—",
        institution: s?.institution ?? "—",
        district: s?.district ?? "—",
        application: a ? ((schemes ?? []).find((x) => x.id === a.scheme_id)?.short_name ?? a.scheme_id) : "—",
        application_id: a?.id ?? null,
        doc_type: d.doc_type,
        issue: notes[0] ?? (d.verification_status === "pending" ? "Awaiting verification" : "Flagged for manual review"),
        priority: notes.length ? "High" : d.verification_status === "manual_review" ? "Medium" : "Low",
        status: d.verification_status,
        extracted: d.extracted_data,
        profile: s,
        created_at: d.created_at,
      };
    });
  });

export const reviewAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        action: z.enum(["verify", "request_correction", "escalate"]),
        remarks: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const role = await assertStaff(supabase as never, userId);
    const { data: doc } = await supabase.from("documents").select("*").eq("id", data.documentId).maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const { data: student } = await supabase.from("student_profiles").select("*").eq("id", doc.student_id).maybeSingle();

    const map = {
      verify: { doc: "verified", vr: "verified", title: "Document verified", type: "verification" },
      request_correction: { doc: "deficiency", vr: "mismatch", title: "Correction required", type: "deficiency" },
      escalate: { doc: "manual_review", vr: "manual_review", title: "Case escalated to Ministry review", type: "info" },
    } as const;
    const m = map[data.action];

    await supabase.from("documents").update({ verification_status: m.doc }).eq("id", data.documentId);
    await supabase.from("verification_records").insert({
      student_id: doc.student_id,
      verification_type: doc.doc_type,
      status: m.vr,
      source: `Officer review (${role})`,
      remarks: data.remarks ?? m.title,
      verified_by: userId,
    });
    if (student?.user_id) {
      await supabase.from("notifications").insert({
        user_id: student.user_id,
        student_id: student.id,
        title: m.title,
        message: `${doc.doc_type}: ${data.remarks ?? m.title}.`,
        type: m.type,
      });
    }
    await audit(supabase as never, userId, role, `review.${data.action}`, "documents", { documentId: data.documentId });
    return { ok: true };
  });

export const advanceApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ applicationId: z.string().uuid(), status: z.string().min(2).max(40), note: z.string().max(400).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const role = await assertStaff(supabase as never, userId);
    const { data: app } = await supabase.from("applications").select("*").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    const { data: student } = await supabase.from("student_profiles").select("*").eq("id", app.student_id).maybeSingle();
    const { data: scheme } = await supabase.from("scholarship_schemes").select("*").eq("id", app.scheme_id).maybeSingle();

    await supabase
      .from("applications")
      .update({ status: data.status, updated_at: new Date().toISOString(), remarks: data.note ?? null })
      .eq("id", data.applicationId);
    await supabase
      .from("application_events")
      .insert({ application_id: data.applicationId, status: data.status, note: data.note ?? `Updated by ${role}.` });

    if (data.status === "sanctioned" && scheme) {
      await supabase.from("payments").insert({
        student_id: app.student_id,
        application_id: app.id,
        scheme_id: app.scheme_id,
        amount: Number(scheme.award_amount ?? 0),
        status: "sanctioned",
        sanction_date: new Date().toISOString().slice(0, 10),
        transaction_reference: `DBT-PROTO-${Math.floor(Math.random() * 900000 + 100000)}`,
        bank_status: "Awaiting DBT batch (simulated)",
      });
    }
    if (["dbt_processing", "paid"].includes(data.status)) {
      await supabase
        .from("payments")
        .update({
          status: data.status === "paid" ? "paid" : "dbt_processing",
          payment_date: data.status === "paid" ? new Date().toISOString().slice(0, 10) : null,
          bank_status: data.status === "paid" ? "Credited to DBT-seeded account (simulated)" : "Bank processing (simulated)",
        })
        .eq("application_id", app.id);
    }

    if (student?.user_id) {
      await supabase.from("notifications").insert({
        user_id: student.user_id,
        student_id: student.id,
        title: `Application status: ${data.status.replace(/_/g, " ")}`,
        message: data.note ?? `Your ${scheme?.short_name ?? "scholarship"} application moved to ${data.status.replace(/_/g, " ")}.`,
        type: "application",
      });
    }
    await audit(supabase as never, userId, role, "application.status_changed", "applications", {
      id: data.applicationId,
      status: data.status,
    });
    return { ok: true };
  });

export const listBeneficiaryGaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, { data }] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase.from("beneficiary_gaps").select("*").order("confidence", { ascending: false }),
    ]);
    return data ?? [];
  });

export const sendOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(100),
        channel: z.enum(["sms", "email", "in_app"]),
        message: z.string().min(5).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const role = await assertStaff(supabase as never, userId);
    await supabase.from("beneficiary_gaps").update({ status: "outreach_sent" }).in("id", data.ids);
    await audit(supabase as never, userId, role, "outreach.sent", "beneficiary_gaps", {
      count: data.ids.length,
      channel: data.channel,
      mode: "simulated",
    });
    return {
      delivered: data.ids.length,
      channel: data.channel,
      mode: "prototype",
      note: "Outreach delivery is simulated for the prototype — no real SMS or email was sent.",
    };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [, { data }] = await Promise.all([
      assertStaff(supabase as never, userId),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return data ?? [];
  });

const SchemeUpdate = z.object({
  id: z.string().min(2).max(40),
  name: z.string().min(3).max(160),
  description: z.string().min(10).max(1000),
  target: z.string().min(3).max(200),
  award_amount: z.number().min(0).max(100000000).nullable(),
  deadline: z.string().nullable(),
  status: z.enum(["open", "closed", "draft"]),
  max_income: z.number().min(0).max(100000000).nullable(),
  min_score: z.number().min(0).max(100),
  levels: z.array(z.string().max(30)).max(10),
  required_documents: z.array(z.string().max(60)).max(20),
});

export const updateScheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SchemeUpdate.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const role = await assertStaff(supabase as never, userId);
    if (role !== "admin") throw new Error("Only Ministry administrators can change scheme rules.");
    const { data: current } = await supabase.from("scholarship_schemes").select("*").eq("id", data.id).maybeSingle();
    const rules = { ...((current?.eligibility_rules ?? {}) as object), max_income: data.max_income, min_score: data.min_score, levels: data.levels };
    const { error } = await supabase
      .from("scholarship_schemes")
      .update({
        name: data.name,
        description: data.description,
        target: data.target,
        award_amount: data.award_amount,
        deadline: data.deadline,
        status: data.status,
        eligibility_rules: rules,
        required_documents: data.required_documents,
        version: (current?.version ?? 1) + 1,
        effective_date: new Date().toISOString().slice(0, 10),
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(supabase as never, userId, role, "scheme.updated", "scholarship_schemes", { id: data.id, version: (current?.version ?? 1) + 1 });
    return { ok: true };
  });
