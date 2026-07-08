# LOVEABLE MASTER BUILD PROMPT — PREQUALY
### Paste this entire document into Loveable as the founding instruction set.

---

You are the founding engineering team of PreQualy, reporting to the CTO. Build an enterprise SaaS application named **PreQualy** — an AI-powered housing intelligence platform designed to become the operating system for affordable homeownership in the United States.

This is NOT a demo and NOT a throwaway MVP. Every architectural decision must prioritize **scalability, modularity, explainability, security, and configurability**. We launch in five Southern California counties (Los Angeles, Orange, Riverside, San Bernardino, San Diego), but expanding to all 50 states must be a *data operation*, never a rewrite.

## NON-NEGOTIABLE ENGINEERING LAWS
Violating any of these is a failed build. Re-read them before every feature.

1. **Never hard-code program logic.** Every housing program, eligibility rule, income limit, geography, and benefit formula lives in database tables managed through an admin UI. There must be zero `if (program === 'CalHFA')` statements anywhere in the codebase.
2. **Eligibility is deterministic and explainable.** A configurable rules engine evaluates households. Every outcome stores which rules passed, failed, or were unknown, against which program *version*. AI never decides eligibility — AI only helps humans author rules and helps users understand results.
3. **Buyers never pay and are never sold.** No consumer paywalls. Consumer data moves to a professional only through an explicit, field-scoped, revocable consent record.
4. **Fair housing by construction.** No rule, ranking, matching, or scoring logic may reference or proxy protected classes (race, color, religion, national origin, sex, familial status, disability). Add a code comment `// FAIR-HOUSING REVIEWED` on every ranking/routing function.
5. **Every dead end is a route.** Any "not eligible" result must render the failing rule's plain-language reason and, where possible, the delta ("over the income limit by $4,300").
6. **Row-Level Security on every table. No exceptions.** Households see only their rows. Pros see only consented scopes. Agencies see only their own programs.
7. **Estimates are labeled.** Every dollar figure renders with a `verified_at` stamp and "estimate — a matched professional confirms."

## STACK (Loveable-native)
- **Frontend:** React + Vite + TypeScript, Tailwind, shadcn/ui. React Router with the route map in §6.
- **Backend:** Supabase — Postgres (+ PostGIS extension for geography), Auth, Storage, Edge Functions (Deno), Realtime.
- **AI:** Edge functions calling the Anthropic API (model configurable via env var). No AI calls from the client. All prompts and responses logged to `ai_logs`.
- **Design system:** deep navy `#0A2036`, keyhole cyan `#28E1DE`, action teal `#0E7C86`, hover teal `#0A5F67`, mist `#EAF4F5`, background `#F7FBFC`, line `#DCE8EA`, ink `#122B36`, muted `#5A7076`, success `#0E8A5F`, watch amber `#8A6116`/`#FBF1DC`. Display font **Sora**, body **Inter**. The brand signature is a glowing keyhole mark reserved for "unlock" moments (results reveal, plan completion). Rounded-15px cards, 1px `--line` borders, generous whitespace, WCAG 2.2 AA contrast, visible focus rings, `prefers-reduced-motion` respected.

---

# §1 — AUTH & ROLES
Supabase Auth with email/password + magic link + Google OAuth. Table `profiles` (1:1 with `auth.users`): `role` enum `consumer | professional | agency_admin | nonprofit | employer_admin | builder | prequaly_admin | prequaly_ops`, `locale`, `onboarded_at`.

- New signups default to `consumer`.
- Professional/agency/partner roles are granted only by `prequaly_admin` through the admin console after verification.
- Admin routes and admin RLS policies check role via a `security definer` function `get_my_role()`. Never trust client-side role claims.
- Consumers may use the eligibility screener anonymously (session-scoped) and are prompted to create an account to save results; on signup, migrate the anonymous household to the new user.

# §2 — DATABASE SCHEMA (create exactly; extend, never fork)
Enable extensions: `postgis`, `pg_trgm`, `uuid-ossp`. All tables: `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` triggers. All money as `numeric(12,2)`. Soft-delete via `deleted_at` on user-facing tables.

**Households & profile (Universal Housing Profile)**
```sql
households(id, owner_id → auth.users, composition_type text, county text, city text,
  target_price numeric, monthly_debts numeric, twin_mode text default 'getting_ready',
  locale text default 'en')
household_members(id, household_id, relationship text, birth_year int,
  is_veteran bool, veteran_json jsonb, profession text, counts_toward_income bool)
income_sources(id, member_id, type text, gross_monthly numeric,
  verification_level text default 'self_stated', as_of date)
facts(household_id, key text, value jsonb, source text default 'intake',
  verified_level text, as_of timestamptz, primary key (household_id, key))
```
`facts` is the ONLY input the rules engine reads. An edge function `compute-facts` derives normalized facts (first_time, first_generation, veteran, household_size, income_borrower_only, income_all_adults, own_funds_pct, credit_band, education_complete, dti_back…) from raw profile rows. Programs choose which income definition they test — store parallel income facts.

**Knowledge graph (programs as data)**
```sql
organizations(id, name, org_type text, website)
jurisdictions(id, kind text check (kind in ('state','county','city','tract')),
  name, parent_id, geom geometry(MultiPolygon, 4326))
income_tables(id, name, jurisdiction_scope text, year int,
  matrix jsonb,          -- {"1": 76800, "2": 87750, ...} or {"Los Angeles": {...}}
  source_url text)
programs(id, slug unique, name, admin_org_id, source_type text, status text
  check (status in ('active','active_verify','waitlist','lottery_closed','funds_exhausted','archived')),
  current_version_id uuid)
program_versions(id, program_id, version int,
  geo_include jsonb, geo_exclude jsonb,       -- [{county},{city},{tract_ids[]}]
  rules jsonb,        -- [{id, fact, op, value|{table,by}|{ami_pct,table}, msg, citation}]
  benefit jsonb,      -- {type, amount_rule, cap, forgiveness_years, repayment}
  stacking jsonb,     -- {conflicts_with:[slugs], layer:'primary_dpa'|'closing'|'grant'|'tax_credit'|'financing'|'bmr'}
  docs_required jsonb, blurb text, citations jsonb,
  verified_at date, approved_by uuid[], published bool default false)
funding_cycles(id, program_id, opens_at, closes_at, budget numeric, remaining numeric)
```
Rule `op` set: `== <= >= in within_geo tenure_gte expr`. Amount rules are strings the engine parses: `"0.035*price"`, `"min(0.20*price,150000)"`, `"up_to_140000"`.

**Evaluations & stacking (audit trail)**
```sql
evaluations(id, household_id, program_version_id, outcome text
  check (outcome in ('eligible','likely_eligible','one_step','watching','not_eligible','not_in_area')),
  rule_results jsonb, benefit_estimate numeric, ts timestamptz)
stacks(id, household_id, program_ids uuid[], total_benefit numeric,
  alternates jsonb, ts timestamptz)
hos_scores(household_id, score int, components jsonb, actions jsonb, ts)
```

**Listings & discovery**
```sql
listings(id, source text, mls_id text, address, city, county, tract_id,
  location geometry(Point,4326), price numeric, market_value numeric,
  beds int, baths numeric, sqft int,
  flag text check (flag in ('standard','bmr','new_construction')),
  bmr jsonb,            -- {income_table_id, ami_pct, resale_restriction, deadline}
  incentives jsonb, photos jsonb, status text, refreshed_at)
saved_items(user_id, item_type text, item_id uuid, primary key(user_id,item_type,item_id))
```

**Marketplace, consent, referrals**
```sql
professionals(id, user_id, org_name, pro_type text check (pro_type in
  ('lender','realtor','counselor','builder_rep')), license_no, license_state,
  license_verified_at, languages text[], service_counties text[],
  certifications uuid[],   -- program_ids passed
  rating numeric, closed_count int, capacity int, status text default 'pending')
consents(id, household_id, grantee_type text, grantee_id uuid,
  scope_fields text[], purpose text, granted_at, revoked_at)
referrals(id, household_id, professional_id, consent_id not null,
  status text default 'requested' check (status in
  ('requested','matched','contacted','preapproved','in_contract','closed','withdrawn')),
  milestones jsonb, fee jsonb)
```
A referral row CANNOT be inserted without a live (unrevoked) consent — enforce with a trigger.

**Applications & documents**
```sql
applications(id, household_id, target_type text, target_id uuid, status text,
  field_snapshot jsonb, conditions jsonb, submitted_at)
documents(id, household_id, class text, storage_path text, sha256,
  extraction jsonb, expires_at, verified bool default false)
document_shares(document_id, consent_id, recipient_id, shared_at)
```
Documents live in a **private** Supabase Storage bucket `vault`; access only through signed URLs minted by an edge function that verifies consent.

**Twin, notifications, plan**
```sql
twin_events(id, household_id, trigger text, diff jsonb, material bool, ts)
notifications(id, user_id, kind, title, body, cta_route, read_at, ts)
plan_items(id, household_id, key text, label, why, hos_delta int,
  dollars_delta numeric, done_at)
```

**Ops & AI**
```sql
audit_log(id, actor_id, action, entity, entity_id, before jsonb, after jsonb, ts) -- insert-only
ai_logs(id, agent text, user_id, prompt_hash, input_summary, output jsonb, ts)
program_change_queue(id, source_url, detected_diff, proposed_rules jsonb,
  confidence numeric, status text default 'needs_review', reviewer_id, ts)
```

# §3 — ROW-LEVEL SECURITY (write these policies explicitly)
- `households` + all child tables: `owner_id = auth.uid()` for ALL operations; `prequaly_admin/ops` read via role function.
- `professionals` read own row; consumers can `select` only `status='approved'` rows with public columns (create a view `pros_public`).
- Consented access: pros may `select` a household's rows ONLY through security-definer RPCs (`get_referral_household(referral_id)`) that verify an active consent and return only `scope_fields`. Never grant pros direct table access.
- `programs`, `program_versions (published=true)`, `income_tables`, `listings`: public read.
- Admin tables (`program_change_queue`, `audit_log`, unpublished versions): admin roles only.
- Storage bucket `vault`: no public access; policy denies all; access exclusively via edge function signed URLs.

# §4 — THE RULES ENGINE (edge function `evaluate-eligibility`)
Input: `household_id`. Steps:
1. Load facts. Load all published `program_versions` whose `geo_include` matches the household county/city (PostGIS tract check when address known).
2. Per program, evaluate each rule → `pass | fail | unknown(missing fact)`.
3. Classify: all pass → `eligible` (or `watching` if status is `lottery_closed/funds_exhausted`); only-unknowns → `likely_eligible` with the questions to answer; failures limited to fixable rules (`edu`, `own`, small doc items flagged `fixable:true`) → `one_step` with the steps; otherwise `not_eligible` with first failing rule's `msg` and numeric delta when computable.
4. Compute `benefit_estimate` from `amount_rule` against target price (default $500,000).
5. **Stacking:** choose the largest `primary_dpa` layer; add every compatible `closing/grant/tax_credit/financing` layer; respect `conflicts_with`; write `stacks` with ranked alternates.
6. Compute buying power with/without stack (rate env var, default 6.5%/30yr; tax 1.1%, ins 0.35%, MI 0.6% on loan) and **HOS** (0–1000: financial 30%, opportunity access 25%, momentum 20%, market fit 15%, stability 10%; store per-component points and top actions with `hos_delta` + `dollars_delta`).
7. Persist `evaluations`, `stacks`, `hos_scores`; upsert `plan_items`; emit `twin_events` diff vs previous run; return the full result object.
Target: < 500ms for 100 programs. Pure function core with unit tests over a golden set of at least 25 synthetic households.

# §5 — AI LAYER (edge functions only; Anthropic API; log everything to `ai_logs`)
Build these as separate edge functions with strict system prompts:

- **`ai-guide`** (consumer copilot): answers questions ONLY about the user's own results, plan, and program details. RAG context = the user's latest evaluation + the matched programs' `blurb/rules/citations`. System prompt forbids legal/tax/credit advice, forbids inventing program terms, requires citing the program record, responds in the user's `locale`. Surface as a chat drawer on Results and Program Detail pages.
- **`ai-intake-helper`**: rephrases any intake question in plainer language or another language on tap ("explain this question"). Never changes the question set — product owns the questions.
- **`ai-program-extractor`** (admin-only): give it a pasted guideline URL/PDF text → returns proposed `rules jsonb` + `benefit jsonb` + citations + confidence → writes to `program_change_queue`. NEVER publishes. The admin console shows a side-by-side diff (source text ↔ proposed rules) with Approve (requires 2 distinct admin approvals via `approved_by uuid[]`) / Reject.
- **`ai-doc-classifier`**: on vault upload, classify document class (paystub, W-2, bank statement, ID, VA COE), extract key fields into `documents.extraction`, flag stale dates. User confirms extractions before they touch `facts`.
- **`ai-listing-flagger`** (ops): detect BMR/deed-restriction/incentive language in listing remarks → proposes `flag`/`bmr` fields → ops approves.

Guardrails (all agents): strip PII to the minimum needed; temperature ≤ 0.3 for extraction; every response JSON-schema-validated before use; on validation failure, fail closed and queue for a human.

# §6 — ROUTES & SCREENS (build in this order)
**Public**
- `/` Landing — hero "Unlock homeownership help you didn't know existed," live program count, single CTA → screener, how-it-works (4 steps), trust band, county coverage, footer disclaimers.
- `/programs` SEO directory (filter county/city/type) → `/programs/[slug]` detail: benefit visual, plain-language terms, forgiveness timeline, docs checklist, funding meter, verified stamp + citation link, "Check if I qualify."
- `/homes` public map/list (PostGIS radius + filters); affordability flags appear only when a profile exists.
- `/learn` resource library. `/partners` marketing + partner application form. `/trust` security & privacy page.

**Screener (anonymous-capable)**
- `/check` — 3-step conversational wizard (Where → Household → Money & readiness), tap-first chips, "why we ask" popovers, progress dots, mobile-first. On submit → `compute-facts` → `evaluate-eligibility` → `/results`.
- `/results` — the unlock moment: keyhole glow animation, count-up total assistance, buying power without vs with stack, HOS ring with top 2 actions, then buckets: Your best combination / Also eligible / One step away (with the exact step) / Watching / Not a match (with reasons + deltas). Save prompts account creation.

**Consumer app (auth, sidebar layout)**
- `/app/today` — Digital Twin feed rendered from `notifications` + `twin_events` (funding reopened, rate change, new matching listing, plan nudges).
- `/app/path` — Action plan checklist (each item: why, `+HOS`, `+$` unlocked; checking an item re-runs the engine), HOS breakdown, progress bar.
- `/app/programs` — full results, re-runnable, editable answers.
- `/app/homes` — map + list with per-user flags: Affordable alone / Within reach with your stack / Income-restricted: you qualify / over limit by $X / Builder credits / Above buying power by $X. Payment-based filter. Save homes.
- `/app/homes/[id]` — your real monthly at this address, which of YOUR programs apply here, BMR cap vs your income, "Ask a pro."
- `/app/applications` — Universal Application hub: per-application status, deduplicated outstanding-documents list.
- `/app/documents` — vault: upload, AI classification chip, expiry warnings, per-recipient share toggles.
- `/app/pros` — matched pros, referral timeline (Requested → Matched → Contacted → Pre-approved → In contract → Closed), messaging, rate-after-milestone.
- `/app/consent` — every share: who/what fields/when/purpose, one-tap revoke, full history, export-my-data, delete-account.
- `/connect` — pro selection: 2–3 verified, program-certified pros (language, rating, families helped), explicit consent checkbox naming the pro, then referral created.

**Professional portal** `/pro/*` — pipeline board (referral cards by status), lead detail (consented scope only, the buyer's same plan view), messaging, document requests, milestone updates, profile & certifications, performance stats.

**Agency portal** `/agency/*` — Program Studio: visual rule builder (fact dropdown, operator, value or income-table picker, message, citation), geo picker (county/city/tract), benefit builder, funding cycle manager, publish (2-approval), utilization dashboard (applications by status, dollars reserved, geography heatmap), CSV/HUD export.

**Admin console** `/admin/*` — program change queue (AI proposals w/ diff + dual approve), program editor with dry-run impact ("this change flips 1,204 households"), income-table manager, pro verification queue, listings ops, users, audit log explorer, fair-housing test dashboard (outcome distributions by geography/AMI band — never protected classes), feature flags.

# §7 — SEED DATA (load via migration)
Seed the five launch counties with the 28-program corpus and income tables from the companion file `PreQualy_MVP.jsx` (CalHFA MyHome, CalPLUS+ZIP, Dream For All [lottery_closed], Forgivable Equity Builder, GSFA Platinum, MCC, VA, CalVet, LA LIPA & MIPA, LACDA, Long Beach, OC MAP, Santa Ana, Irvine CLT, Riverside HomeStarter, Riverside PLHA & HOME, Moreno Valley, NHSIE, IEDPA, Ontario CHDO, SDHC FTHB, SD DCCA, SDHC Affordable For-Sale) — translate each into `programs` + `program_versions` rows with rules-as-data, plus the 12 sample listings, income tables, city lists, and 10 sample professionals. Mark every seed `verified_at` and stamp UI accordingly.

# §8 — NOTIFICATIONS & THE DIGITAL TWIN LOOP
Postgres triggers on `program_versions.published`, `funding_cycles`, and `listings` insert → enqueue affected households (match by county + latest evaluation) → scheduled edge function `twin-recompute` (Supabase cron, every 15 min) re-runs the engine for queued households → material diffs (new eligible program, ≥$5,000 benefit change, ≥$10,000 buying-power change, matching new listing) create `notifications` + Today-feed cards. Email via Resend; respect per-channel preferences; log sends.

# §9 — QUALITY BARS (definition of done, every phase)
- RLS verified by tests that attempt cross-tenant reads and expect failure.
- Golden-household test suite green (25+ households × full corpus, every outcome asserted).
- Lighthouse ≥ 90 accessibility on `/`, `/check`, `/results`; keyboard-complete flows.
- Every dollar figure shows verified-date; every "not eligible" shows a reason; every empty state instructs.
- Footer on all pages: "Screening only — not a loan approval, credit decision, or legal advice. Free for homebuyers, always."
- No secrets client-side; AI calls server-only; `ai_logs` and `audit_log` populated.

# §10 — BUILD ORDER (ship in this sequence; each phase is releasable)
1. **Foundation:** auth+roles, schema+RLS, seed migration, design system, Landing.
2. **Screener core:** `/check` wizard, `compute-facts`, `evaluate-eligibility` + stacking + HOS, `/results` with the keyhole unlock moment.
3. **Consumer app:** accounts, `/app/path` plan, `/app/programs`, saved items, `/app/today` (static v1).
4. **Discovery:** listings + PostGIS + per-user flags, `/app/homes` map + detail.
5. **Marketplace:** pros, consent, referrals, `/connect`, `/pro` pipeline, messaging.
6. **Vault + Applications:** private storage, `ai-doc-classifier`, applications hub.
7. **Twin live:** triggers + cron recompute + notifications + email.
8. **Portals & Admin:** Program Studio, admin console, `ai-program-extractor` queue, fair-housing dashboard.
9. **AI Guide:** `ai-guide` chat drawer, `ai-intake-helper`, multilingual pass (English + Spanish first).

Begin with Phase 1. After each phase, run the quality bars in §9 before continuing. When a requirement here conflicts with convenience, this document wins.
