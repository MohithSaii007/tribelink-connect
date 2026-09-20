import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { LoadingPanel, PageHeader, PrototypeBadge, ProgressBlock } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { DEGREE_LEVELS, profileCompletion } from "@/lib/intel";
import { updateStudentProfile } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Unified Profile · TRIBALINK" },
      { name: "description", content: "One profile for every tribal scholarship scheme: personal, tribal, academic, family income and DBT bank details." },
      { property: "og:title", content: "My Unified Profile · TRIBALINK" },
      { property: "og:description", content: "Enter your details once; every application reuses them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

type Form = Record<string, string | boolean | null>;

const TEXT = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function Profile() {
  const { data, isPending } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const saveFn = useServerFn(updateStudentProfile);
  const [form, setForm] = useState<Form>({});

  useEffect(() => {
    const s = data?.student;
    if (!s) return;
    setForm({
      full_name: TEXT(s.full_name),
      dob: TEXT(s.dob),
      gender: TEXT(s.gender),
      phone: TEXT(s.phone),
      email: TEXT(s.email),
      state: TEXT(s.state),
      district: TEXT(s.district),
      tribe: TEXT(s.tribe),
      st_status: Boolean(s.st_status),
      pvtg_status: Boolean(s.pvtg_status),
      institution: TEXT(s.institution),
      aishe_code: TEXT(s.aishe_code),
      course: TEXT(s.course),
      degree_level: TEXT(s.degree_level),
      year_of_study: TEXT(s.year_of_study),
      enrollment_no: TEXT(s.enrollment_no),
      academic_score: TEXT(s.academic_score),
      annual_income: TEXT(s.annual_income),
      parent_name: TEXT(s.parent_name),
      parent_occupation: TEXT(s.parent_occupation),
      bank_account_name: TEXT(s.bank_account_name),
      bank_name: TEXT(s.bank_name),
      account_number_masked: TEXT(s.account_number_masked),
      ifsc: TEXT(s.ifsc),
      dbt_enabled: Boolean(s.dbt_enabled),
    });
  }, [data?.student]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveFn({ data: payload as never }),
    onSuccess: () => {
      refresh();
      toast.success("Profile saved. Every scheme now uses these details.");
    },
    onError: (e: Error) => toast.error(e.message || "We couldn't save your profile. Please check the highlighted fields."),
  });

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="My profile" />
        <LoadingPanel rows={6} />
      </div>
    );
  }

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: string) => String(form[k] ?? "");
  const completion = profileCompletion(data.student);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = str("full_name").trim();
    if (name.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    const phone = str("phone");
    if (phone && !/^\d{10}$/.test(phone)) {
      toast.error("Mobile number must be 10 digits.");
      return;
    }
    const score = str("academic_score");
    if (score && (Number(score) < 0 || Number(score) > 100)) {
      toast.error("Academic score must be between 0 and 100.");
      return;
    }
    const num = (k: string) => (str(k) === "" ? null : Number(str(k)));
    const text = (k: string) => (str(k) === "" ? null : str(k));

    save.mutate({
      full_name: name,
      dob: text("dob"),
      gender: text("gender"),
      phone: text("phone"),
      email: text("email"),
      state: text("state"),
      district: text("district"),
      tribe: text("tribe"),
      st_status: Boolean(form["st_status"]),
      pvtg_status: Boolean(form["pvtg_status"]),
      institution: text("institution"),
      aishe_code: text("aishe_code"),
      course: text("course"),
      degree_level: text("degree_level"),
      year_of_study: num("year_of_study"),
      enrollment_no: text("enrollment_no"),
      academic_score: num("academic_score"),
      annual_income: num("annual_income"),
      parent_name: text("parent_name"),
      parent_occupation: text("parent_occupation"),
      bank_account_name: text("bank_account_name"),
      bank_name: text("bank_name"),
      account_number_masked: text("account_number_masked"),
      ifsc: text("ifsc"),
      dbt_enabled: Boolean(form["dbt_enabled"]),
    });
  }

  const field = (k: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={str(k)} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My unified profile"
        description="These details auto-fill every scholarship application. Update them once and they apply everywhere."
      />

      <Card>
        <CardContent className="pt-6">
          <ProgressBlock label="Profile completion" percent={completion.percent} hint={completion.missing.length ? `Missing: ${completion.missing.join(", ")}` : "Complete."} />
        </CardContent>
      </Card>

      <form className="space-y-6" onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
            <CardDescription>As recorded on your official documents.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {field("full_name", "Full name", { required: true })}
            {field("dob", "Date of birth", { type: "date" })}
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select value={str("gender")} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field("phone", "Mobile number", { inputMode: "numeric", maxLength: 10 })}
            {field("email", "Email address", { type: "email" })}
            {field("state", "State")}
            {field("district", "District")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tribal details</CardTitle>
            <CardDescription>Used for ST and PVTG eligibility rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {field("tribe", "Tribe / community")}
            <div className="space-y-2 rounded-md border border-border p-3 sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={Boolean(form["st_status"])} onCheckedChange={(v) => set("st_status", v === true)} />
                <span>I belong to a Scheduled Tribe (ST) community</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={Boolean(form["pvtg_status"])} onCheckedChange={(v) => set("pvtg_status", v === true)} />
                <span>I belong to a Particularly Vulnerable Tribal Group (PVTG)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic details</CardTitle>
            <CardDescription>AISHE / UDISE+ reference lets TRIBALINK cross-check your institution.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {field("institution", "Institution name")}
            {field("aishe_code", "AISHE / UDISE+ reference")}
            {field("course", "Course")}
            <div className="space-y-1.5">
              <Label htmlFor="degree_level">Level of study</Label>
              <Select value={str("degree_level")} onValueChange={(v) => set("degree_level", v)}>
                <SelectTrigger id="degree_level">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("year_of_study", "Year of study", { type: "number", min: 1, max: 10 })}
            {field("enrollment_no", "Enrollment / APAAR ID")}
            {field("academic_score", "Latest academic score (%)", { type: "number", min: 0, max: 100 })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Family &amp; income</CardTitle>
            <CardDescription>Annual family income decides the income-ceiling rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {field("parent_name", "Parent / guardian name")}
            {field("parent_occupation", "Parent / guardian occupation")}
            {field("annual_income", "Annual family income (₹)", { type: "number", min: 0 })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank &amp; DBT</CardTitle>
            <CardDescription>Store the masked account number only — never your full account number.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {field("bank_account_name", "Account holder name")}
            {field("bank_name", "Bank name")}
            {field("account_number_masked", "Masked account number", { placeholder: "XXXXXX4821" })}
            {field("ifsc", "IFSC code")}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 rounded-md border border-border p-3 text-sm">
                <Checkbox checked={Boolean(form["dbt_enabled"])} onCheckedChange={(v) => set("dbt_enabled", v === true)} />
                <span>My account is Aadhaar-seeded and DBT-enabled (simulated confirmation in this prototype)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save profile
          </Button>
          <PrototypeBadge label="No real Aadhaar, bank or identity data is stored in this prototype" />
        </div>
      </form>
    </div>
  );
}
