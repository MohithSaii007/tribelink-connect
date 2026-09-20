# TRIBALINK

**One Student. One Scholarship View. One Connected Platform.**

A prototype unified tribal scholarship platform built for Smart India Hackathon 2026,
Problem Statement **SIH26238** (Ministry of Tribal Affairs).

> **PROTOTYPE — SIMULATED GOVERNMENT INTEGRATION.** TRIBALINK does **not** connect to
> DigiLocker, UIDAI, UDISE+, APAAR, AISHE, NSP, SFMP, NOS or DBT. Every integration is a
> mock endpoint returning synthetic data, and every student record is fabricated for
> demonstration.

## The problem

Tribal scholarship delivery is spread across NSP, SFMP, NOS and several state systems.
Students re-enter the same details and re-upload the same certificates for every scheme,
officers re-verify the same documents, and genuinely eligible students are never reached
at all.

## The principle: VERIFY ONCE → REUSE EVERYWHERE

One student profile, one document vault, one verification result — reused across all five
schemes: Pre-Matric, Post-Matric, Top Class, National Fellowship for ST (NFST) and
National Overseas Scholarship (NOS).

## Demo accounts

Open `/auth` and press **Load demo accounts and synthetic data** once. It is idempotent
and creates:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@tribalink.demo` | `TribaLink#2026s` |
| Officer / Admin | `admin@tribalink.demo` | `TribaLink#2026a` |

Seeding also loads ~37 synthetic students, applications at every stage, documents with
deliberate mismatches, simulated DBT payments and 24 potential-beneficiary records.

## What is included

**Student workspace** — dashboard, unified profile, eligibility across all five schemes
with plain-language reasons, document vault with simulated OCR and DigiLocker import,
verification with six checks, guided eight-step application, application timeline,
DBT payment tracking, notifications, JAGO multilingual assistant (English / हिंदी / తెలుగు),
help and settings.

**Ministry console** — KPI dashboard, student register, application workflow with sanction
and simulated DBT, manual review queue with explained mismatches, verification analytics,
state and district coverage analytics, beneficiary-gap intelligence with simulated
outreach, configurable scheme rules with versioning, audit logs and settings.

## Explainable, human-decided

The platform flags and explains; officers decide. Nothing is auto-rejected, every
mismatch carries a written reason, and every decision is written to the audit log.

## Tech

TanStack Start (React 19, Vite), Tailwind CSS v4, Lovable Cloud (Postgres, auth, row-level
security), Recharts, and Lovable AI for the JAGO assistant with a deterministic
rule-based fallback.

## Mock integration endpoints

`/api/integrations/{digilocker|udise|aishe|apapr|uidai|edistrict|ugc}` — each returns
clearly-labelled synthetic data with a prototype disclaimer.
