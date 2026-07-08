# CLAUDE.md — PreQualy

Instructions for Claude Code and any developer working in this repository.
Read fully before writing code. When a requirement here conflicts with convenience, this file wins.

## What this project is
PreQualy is an AI-powered housing intelligence platform — the operating system for
affordable homeownership. Launch region: five Southern California counties
(Los Angeles, Orange, Riverside, San Bernardino, San Diego). Expanding to any new
state or county must be a DATA operation, never a code change.

Buyers use PreQualy free to discover every program, grant, and below-market home they
qualify for; professionals, agencies, and partners are the paying side.

## Non-negotiable engineering laws
1. **Never hard-code program logic.** Programs, rules, income limits, geographies, and
   benefits live in database rows (`programs`, `program_versions`, `income_tables`).
   Zero `if (program === '...')` anywhere. If you are tempted, add a rule field instead.
2. **Eligibility is deterministic and explainable.** The rules engine decides; AI never
   does. Every evaluation persists its rule-by-rule results (`evaluations.rule_results`).
3. **Buyers never pay and are never sold.** No consumer paywalls. Data reaches a
   professional only through a live row in `consents`, scoped to `scope_fields`.
4. **Fair housing by construction.** No rule, ranking, matching, or scoring logic may use
   or proxy protected classes. Mark every ranking/routing function `// FAIR-HOUSING REVIEWED`.
5. **RLS on every table, no exceptions.** Cross-tenant reads must fail in tests.
6. **Every dead end is a route.** "Not eligible" always renders the failing rule's
   plain-language reason and, when computable, the delta ("over the limit by $4,300").
7. **Estimates are labeled.** Every dollar figure ships with `verified_at` and the words
   "estimate — a matched professional confirms."

## Stack
- **Frontend:** React + Vite + TypeScript, Tailwind, shadcn/ui. Design tokens:
  navy `#0A2540`, keyhole cyan `#2BE3E0`, action teal `#0E7C86`, mist `#E9F5F7`,
  line `#E3EEF1`. Display font Plus Jakarta Sans, body Inter. Pill buttons, 18–24px
  card radii, WCAG 2.2 AA, respect `prefers-reduced-motion`. The glowing keyhole is
  reserved for "unlock" moments — do not scatter it.
- **Backend:** Supabase — Postgres (+ PostGIS in R2), Auth, Storage (private `vault`
  bucket), Edge Functions in TypeScript/Deno, Realtime, cron.
- **AI:** Anthropic API from edge functions ONLY (never client-side). Log every call to
  `ai_logs`. JSON-schema-validate outputs; fail closed to a human queue.

## Repository map
- `PreQualy_MVP.jsx` — the single-file consumer prototype (reference implementation of
  the engine, stacking, buying power, and all consumer UX). Port from it; don't discard it.
- `migrations/001_schema.sql` — full schema, triggers, RLS policies, consent-gated
  `get_referral_household()` RPC. Run first.
- `migrations/002_seed.sql` — 25 programs, 15 income tables, orgs, pilot listings.
- `migrations/003_interest_list.sql` — public insert-only interest list.
- `Loveable_Master_Build_Prompt.md` — the authoritative build spec: schema details,
  routes, edge functions, AI guardrails, and the 9-phase build order. Follow its phases;
  each phase must be releasable and pass §9 quality bars before the next begins.
- `PreQualy_Production_Blueprint.md` — the long-term ten-volume design (context, not tasks).
- `Program_Verification_Workbook.xlsx` — data-ops source of truth for verifying seeded
  figures. Seeded values are 2026 planning estimates until this workbook marks them Verified.

## Working rules for Claude Code sessions
- Before any feature: check the build prompt's phase order; do not skip ahead.
- Schema changes: new migration files only — never edit 001–003 in place after deploy.
- Program data changes go through `program_versions` (new version row, `published=true`,
  two entries in `approved_by`) — never UPDATE rules on a published version.
- Secrets: anon key may live client-side; `service_role` key NEVER. AI keys in edge
  function env only.
- Tests required per change: RLS cross-tenant denial tests + golden-household eligibility
  regression (every outcome asserted) + accessibility on touched routes.
- Every dollar shown in UI: include `verified_at` stamp. Every list/empty state: instruct
  the user what to do next.
- Footer on all consumer pages: "Screening only — not a loan approval, credit decision,
  or legal advice. Free for homebuyers, always."

## Definition of done (any phase)
RLS verified · golden-household suite green · Lighthouse a11y ≥ 90 on touched pages ·
no secrets client-side · `audit_log`/`ai_logs` populated for new actions · estimates
labeled · reasons shown on every "not eligible."
