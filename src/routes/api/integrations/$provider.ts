import { createFileRoute } from "@tanstack/react-router";

/**
 * TRIBALINK — Mock Government Integration Layer.
 *
 * PROTOTYPE / MOCK DATA. These endpoints return realistic synthetic responses
 * with the same shape an authorised integration would use, so the production
 * system can later swap the handler body for a real API call without changing
 * any caller. No live government system is contacted.
 */

type Provider = "digilocker" | "udise" | "aishe" | "apaar" | "uidai" | "edistrict" | "ugc";

const now = () => new Date().toISOString().slice(0, 10);

const base = (source: string) => ({
  mode: "prototype" as const,
  disclaimer: "PROTOTYPE / MOCK DATA — simulated government integration. No live system was contacted.",
  source,
  verifiedAt: now(),
});

const RESPONSES: Record<Provider, (ref: string) => unknown> = {
  digilocker: (ref) => ({
    ...base("DigiLocker"),
    status: "verified",
    accountRef: ref,
    issuedDocuments: [
      { type: "ST Certificate", issuer: "Revenue Department", docId: "ST/2024/PROTO/4821", issuedOn: "2024-06-11" },
      { type: "Income Certificate", issuer: "Tahsildar Office", docId: "INC/2025/PROTO/9143", issuedOn: "2025-04-02" },
      { type: "Academic Marksheet", issuer: "State Board", docId: "MRK/2025/PROTO/7765", issuedOn: "2025-05-28" },
      { type: "Aadhaar/Identity Proof", issuer: "UIDAI", docId: "IDP/PROTO/2210", issuedOn: "2019-01-15" },
    ],
  }),
  udise: (ref) => ({
    ...base("UDISE+"),
    status: "verified",
    udiseCode: ref,
    schoolName: "Govt. Tribal Residential High School",
    managementType: "Department of Tribal Welfare",
    enrolment: { total: 642, st: 588, pvtg: 74 },
  }),
  aishe: (ref) => ({
    ...base("AISHE"),
    status: "verified",
    aisheCode: ref,
    institutionName: "Government Degree College",
    recognised: true,
    affiliation: "State University",
  }),
  apaar: (ref) => ({
    ...base("APAAR"),
    status: "verified",
    apaarId: ref,
    academicBank: { credits: 84, lastUpdated: now() },
    enrolmentStatus: "active",
  }),
  uidai: (ref) => ({
    ...base("UIDAI"),
    status: "verified",
    identityRef: ref,
    match: { name: true, dob: true, gender: true },
    note: "Demographic match only. No Aadhaar number is stored or transmitted in this prototype.",
  }),
  edistrict: (ref) => ({
    ...base("State e-District"),
    status: "verified",
    certificateRef: ref,
    certificateType: "Income Certificate",
    annualIncome: 180000,
    issuingAuthority: "Tahsildar",
    validUntil: "2027-03-31",
  }),
  ugc: (ref) => ({
    ...base("UGC / NTA"),
    status: "verified",
    scholarRef: ref,
    fellowshipEligible: true,
    programme: "Ph.D",
  }),
};

export const Route = createFileRoute("/api/integrations/$provider")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const provider = params.provider as Provider;
        const handler = RESPONSES[provider];
        if (!handler) {
          return Response.json(
            { error: "Unknown integration", available: Object.keys(RESPONSES), mode: "prototype" },
            { status: 404 },
          );
        }
        const ref = new URL(request.url).searchParams.get("ref") ?? "PROTO-REF-0001";
        if (ref.length > 64) return Response.json({ error: "Invalid reference" }, { status: 400 });
        return Response.json(handler(ref));
      },
    },
  },
});
