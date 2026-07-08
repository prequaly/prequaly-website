# PreQualy — The Operating System for Affordable Homeownership
## Complete Production Platform Blueprint · v1.0 · July 2026

**One sentence:** PreQualy maintains a living financial model of every household and continuously matches it against every homeownership opportunity in America — programs, money, homes, and people — then guides the household step-by-step until they hold keys.

**Design mandate:** Not an MVP. This is the specification for national infrastructure capable of serving millions of users across consumers, lenders, Realtors, builders, nonprofits, employers, foundations, and government agencies.

---

# VOLUME 1 — VISION, PHILOSOPHY & THE PREQUALY CONSTITUTION

## 1.1 The Problem, Stated Precisely
Thousands of homeownership resources exist — down payment assistance (DPA), closing-cost grants, employer-assisted housing, community land trusts, shared equity, income-restricted homes, FHA/VA/USDA products, builder incentives, foundation grants, city and county programs. They are administered by tens of thousands of disconnected entities, each with its own eligibility rules, income tables, geographies, funding cycles, and application forms. Billions of dollars go unused annually while qualified families conclude — wrongly — that homeownership is out of reach.

Current systems ask: *"Can this borrower qualify for my loan?"*
PreQualy asks: *"What is every possible path to homeownership available to this household?"*
Every feature in this blueprint must serve that question.

## 1.2 The PreQualy Constitution
Immutable principles every future feature must satisfy. Product, engineering, and AI reviews test against these before ship.

1. **Buyer-first, always free for buyers.** No feature may charge, upsell, or degrade the experience for a consumer. Revenue comes from the supply side.
2. **One profile, hundreds of opportunities.** A household enters information exactly once. Every subsequent use of that data is reuse, never re-entry.
3. **Deterministic eligibility, explainable always.** Eligibility decisions come from a versioned, auditable rules engine — never from an opaque model. AI proposes; the rules engine decides. Every result shows the exact rule that produced it.
4. **Never hard-code program logic.** All programs, income tables, geographies, and rules are data managed through the admin console. Adding a state is a data operation, not a software release.
5. **Fair housing by construction.** No model, rule, ranking, or professional-routing decision may use — or proxy for — protected-class attributes. Continuous disparate-impact testing is a release gate.
6. **Consent is granular, revocable, and logged.** Data moves to a professional or agency only with explicit, purpose-scoped, timestamped consent that the user can withdraw in one tap.
7. **Proactive, not reactive.** The platform watches on the household's behalf. When anything changes that improves their path — a reopened grant, a rate drop, a newly listed eligible home — PreQualy tells them first.
8. **Every dead end is a route.** "Not eligible" always ships with the reason and the shortest set of actions that changes the answer.
9. **Build once, scale everywhere.** California to 50 states is data expansion, not re-architecture.
10. **Trust is the product.** Security, accuracy stamps ("verified as of"), and honest uncertainty ("funding-dependent, confirm with your pro") are features, not disclaimers.

## 1.3 Strategic Assets (defensible IP)
- **National Housing Knowledge Graph** — the canonical, versioned graph of every program, funder, geography, income table, and their relationships. The dataset nobody else maintains.
- **UHEE (Universal Housing Eligibility Engine)** — deterministic rules engine + AI interpretation layer evaluating a household against the entire graph in <500ms.
- **HOS™ (Homeownership Opportunity Score)** — the proprietary, actionable readiness metric (see 4.6).
- **Homeownership Digital Twin** — the living household model that turns PreQualy from a search tool into a standing AI advisor (see 4.7).
- **Universal Application Engine** — one profile auto-populating hundreds of program applications (see 4.8).
- **Tri-sector marketplace** — verified professionals, nonprofits, and agencies transacting on shared data rails.

---

# VOLUME 2 — USERS, PERSONAS & END-TO-END JOURNEYS

## 2.1 Persona Registry
| # | Persona | Core job-to-be-done | Primary surface |
|---|---------|--------------------|-----------------|
| P1 | **First-time buyer** (renter, 25–45, often first-generation) | "Show me if homeownership is actually possible for me, and how." | Consumer app |
| P2 | **Credit-rebuilding aspirant** (12–36 months out) | "Give me a plan and tell me when I'm ready." | Consumer app / Digital Twin alerts |
| P3 | **Veteran / active-duty** | "Maximize my earned benefits and stack them." | Consumer app (VA pathway) |
| P4 | **Multi-generational household** | "Count our real household correctly — three incomes, one roof." | Consumer app (advanced income engine) |
| P5 | **Loan officer / lender** | "Send me pre-screened, program-matched, consented borrowers." | Lender portal |
| P6 | **Realtor** | "Buyers who know their real budget, with assistance underwritten." | Pro portal |
| P7 | **Builder / developer** | "Fill my BMR units and market my incentives to eligible buyers." | Builder portal |
| P8 | **Nonprofit / HUD counselor** | "Manage my caseload and program pipeline in one place." | Nonprofit portal |
| P9 | **Employer HR** | "Administer our employer-assisted housing benefit." | Employer portal |
| P10 | **Government agency** | "Publish my program once, reach every eligible resident, report utilization." | Agency portal |
| P11 | **Foundation / funder** | "See where my dollars land, demographically and geographically." | Impact dashboards |
| P12 | **PreQualy operations** | "Keep 30,000 programs accurate without engineers." | Admin console |

## 2.2 The Canonical Consumer Journey (P1)
Understand eligibility → Discover programs → Find attainable homes → Connect with professionals → Apply everywhere at once → Purchase → Stay supported as an owner.

**Stage-by-stage:**
1. **Arrive** (SEO/partner referral/agency link) → value shown in <5 seconds → "Check my eligibility" (no account required to see initial results).
2. **Conversational intake** (7–12 adaptive questions, 2 minutes, no credit pull) → instant Opportunity Snapshot: assistance total, buying power with/without stack, HOS™.
3. **Create account** to save results → Universal Housing Profile begins; progressive profiling deepens it over weeks, never as a wall.
4. **Explore** program matches, one-step-aways, watched programs; browse flagged homes on the map.
5. **Act** on the generated Action Plan (education class, savings target, document vault).
6. **Connect** — consented, matched professional; referral tracked end-to-end.
7. **Apply** — Universal Application Engine pre-fills lender and program applications; document vault shares once, everywhere permitted.
8. **Close** — milestone tracking with pro; assistance funds reserved and confirmed.
9. **Own** — Digital Twin keeps watching: refi opportunities, property-tax exemptions, home-repair grants, equity milestones.

## 2.3 Professional Journey (P5/P6)
Apply → verification (license via NMLS/DRE APIs, E&O insurance, background attestation) → program certification (pass PreQualy's per-program training modules) → profile live in marketplace → receive consented referrals scored by intent → work leads in built-in light CRM (or sync to Salesforce/Follow Up Boss) → outcome reporting (contact → pre-approval → contract → close) → pay per qualified referral and/or success fee → performance score feeds future routing.

## 2.4 Agency Journey (P10)
Claim agency workspace → publish/edit programs in the Program Studio (structured rule builder, no code) → set funding levels and cycles → receive applications through Universal Application Engine → decision within portal → utilization, equity, and geographic dashboards auto-generated → export HUD/HCD-format reports.

---

# VOLUME 3 — THE CONSUMER EXPERIENCE (EVERY SCREEN & WORKFLOW)

## 3.1 Information Architecture
```
Public:  Home · How it works · Programs directory (SEO, per city/county/program)
         · Homes (map) · Resources/Learn · For Partners · Pricing (partners) · Trust & Security
App:     Today (Digital Twin feed) · My Path (plan + HOS) · Programs · Homes
         · Applications · Documents · My Pros · Settings/Consent Center
```

## 3.2 Screen Inventory & Specifications (consumer)

**S1. Landing / Home.** Hero: "Unlock homeownership help you didn't know existed." Live counters (programs mapped, dollars matched this month). Single primary CTA. Trust band (government · nonprofit · lender · below-market homes). Localized variants per metro for SEO.

**S2. Conversational Intake (UHEE Interview).** Chat-style adaptive interview, tap-first answers, plain language at 6th-grade reading level, 30+ languages. Goes beyond a loan application — asks what *programs* need:
- Location intent (county → city → neighborhoods, "open to nearby")
- **Household composition:** everyone who will live in the home; relationships; ages. Income counted per program definition — some count all members 18+, some borrower-only. The engine stores both and applies the right one per program.
- Income sources per member: W-2, self-employment, gig (bank-linked averaging), SSI/SSDI, VA disability, child support, seasonal.
- First-time status (3-year rule with exceptions: displaced homemaker, single parent), first-generation, veteran/active-duty, tribal enrollment, disability, teacher/first-responder/healthcare (profession-based programs), current public-housing or Section 8 (HCV homeownership conversion).
- Credit band (self-stated → optional soft pull later), savings, monthly debts, target price/payment.
Every question shows *why we ask* on tap. Skip anything; skipped items become "answer to unlock" prompts later.

**S3. Opportunity Snapshot (results).** The signature "unlock" moment: glowing keyhole animation → total stackable assistance → buying power *without* vs *with* PreQualy stack → HOS™ ring with the two fastest score-raising actions → buckets: **Your best combination** (stacked), **Also eligible** (alternatives), **One step away** (with the exact step), **Watching** (funding closed; alerts on), **Not a match** (with the precise reason). Every card: amount, plain-language terms, admin, verified-date stamp, "Why I match" expander showing each rule pass/fail, Save, Share-with-pro.

**S4. Program Detail.** Full terms, repayment/forgiveness schedule visualized on a timeline, stacking compatibility matrix, required documents checklist, funding status meter, application route (via PreQualy Universal Application where integrated; guided external link otherwise), FAQ generated from source documents with citations to the official guideline PDF.

**S5. Homes (Discovery Map).** Google-Maps-grade map + list. Every listing carries PreQualy flags computed per user: *Affordable without assistance* · *Within reach with your stack* · *Income-restricted — you qualify* · *Income-restricted — over limit (by $X)* · *New construction with builder credits* · *In a targeted-area (higher limits apply here)*. Layers: program geographies (census-tract targeted areas, city boundaries), school ratings, commute isochrones from user's workplace, opportunity index. Filters include monthly payment (with stack applied) — not just price. Saved searches → Digital Twin alerts.

**S6. Home Detail.** Photos, facts, *your* real monthly (rate + tax + insurance + MI − assistance effects), which of *your* programs apply to *this* address (geo-resolved to tract), affordability verdict, "Ask a pro about this home," schedule tour (routed to matched Realtor), BMR-specific: resale restriction explainer, income cap vs your income, application deadline.

**S7. My Path (Action Plan + HOS).** Auto-generated, prioritized checklist (education, savings target with progress bar, credit actions, documents). Each item: why it matters, estimated HOS impact ("+8"), estimated new dollars unlocked. Completing items re-runs the engine live. Shareable with matched pro (consent-scoped).

**S8. Applications Hub.** Universal Application Engine surface: applications in flight across lender + programs, status per application (draft → submitted → in review → conditions → approved), conditions/documents outstanding, deadlines. One "documents needed" list deduplicated across all applications.

**S9. Document Vault.** Bank-grade storage: ID, paystubs, W-2s, tax returns, bank statements, VA COE. AI document intelligence (see 4.9) classifies, extracts, flags expirations ("your newest paystub is 47 days old — most programs require ≤30"). Per-document, per-recipient sharing permissions.

**S10. My Pros.** Matched professionals, message threads, referral status timeline (Requested → Matched → First contact → Pre-approved → In contract → Closed), consent controls, rate-your-pro after milestones.

**S11. Today (Digital Twin feed).** The daily reason to return: "Dream For All reopens Monday — you're pre-positioned." "Rates dropped 0.375% — your buying power rose $23K." "New Irvine CLT listing matches you — 14 units, deadline Aug 1." "You're 1 class away from +$40,000."

**S12. Consent & Privacy Center.** Every data share listed: who, what fields, when, purpose; one-tap revoke; full audit log; download-my-data; delete-my-account (CCPA/CPRA rights built as product, not email requests).

**S13. Learn.** Localized, multilingual education library; embedded eHome America / Framework course completion syncs certificates straight into the vault and flips the `education` fact automatically.

## 3.3 Cross-cutting UX Standards
WCAG 2.2 AA; full keyboard and screen-reader support; 30+ languages with human-reviewed housing terminology; SMS-first flows for low-bandwidth users; every number annotated "estimate — verified {date}"; empty states always instruct; brand system: deep navy `#0A2036`, keyhole cyan `#28E1DE`, action teal `#0E7C86`, Sora display / Inter body; the glowing keyhole is the signature moment reserved for "unlock" events.

---

# VOLUME 4 — THE INTELLIGENCE CORE

## 4.1 Universal Housing Profile (UHP)
The single, secure, versioned record of a household. Collected once, reused everywhere permitted.

**Entity model:**
- `household` — id, primary_user, composition_type (single/couple/multi-generational/co-buyers), preferred_language, created/updated, consent_state
- `household_member` — relationship, dob, ssn_token (vaulted), citizenship/eligibility status, veteran fields (branch, service dates, disability rating, COE status), student status, disability, profession (for teacher/first-responder/healthcare programs), counts_toward_income (per program definition, computed)
- `income_source` — member_id, type (W2, 1099, gig, SSI/SSDI, VA, pension, child_support, seasonal, rental), gross_monthly, verification_level (self-stated → doc-verified → bank-verified), seasonality profile
- `assets` — accounts (Plaid-linked optional), balances, gift funds & donor relationship, retirement (with withdrawal-permission flags)
- `liabilities` — tradelines (soft pull, consented), monthly obligations, student-loan IDR flags
- `intent` — target geographies (county/city/tract polygons), price/payment band, property types, must-haves, timeline
- `facts` — the computed, normalized fact set the rules engine consumes (first_time, first_generation, veteran, ami_ratio_by_definition[], dti_front/back, reserves_months, education_complete…). Every fact carries `source`, `verified_level`, `as_of`.

**Advanced Income Engine.** Programs define income differently (borrower-only vs all-adults; gross vs adjusted; current vs trailing-12). The engine computes *every* definition per household and stores them as parallel facts, so a multi-generational household with three earners is evaluated correctly program-by-program instead of failing on a single naive number.

**Life Circumstances Engine.** Detects and models events that change eligibility: new job (income seasoning clocks), marriage/divorce, new child (household size ↑ → limits ↑), relocation, military PCS orders, disability onset. Each event triggers a Digital Twin re-plan.

## 4.2 National Housing Knowledge Graph (NHKG)
The canonical graph of American homeownership opportunity.

**Node types:** Program · Funder/Administrator · Jurisdiction (state/county/city/tract) · IncomeTable (AMI matrices by size, HUD-refreshed) · Requirement · Benefit · Document · FundingCycle · Property(BMR inventory) · Professional · Lender product · Employer benefit · Builder incentive.
**Edge types:** administered_by, funded_by, available_in (geo polygons), limited_by (income table @ % AMI), requires, stacks_with / conflicts_with, supersedes (versioning), converts_to (e.g., HCV → homeownership voucher).

**Population pipeline (AI Program Intelligence, agent A1):** crawlers monitor ~30k sources (state HFAs, counties, cities, HUD, nonprofits, builders) → diff detector flags changes → LLM extraction converts guideline PDFs/webpages into candidate structured rules **with citations to source text** → confidence-scored → human data-ops review queue (two-person approval for rule changes; auto-approve only for verified low-risk changes like a phone number) → versioned publish. Every program shows *verified as of* and links to its source. Target freshness SLA: income tables within 7 days of HUD release; funding status within 48 hours of source change.

## 4.3 Dynamic Rules Engine (deterministic core of UHEE)
- Rules are data: `rule = {fact, operator, value | table_ref | expression, message, citation}` grouped with AND/OR/NOT trees per program version.
- Operators: comparison, set membership, geo-containment (point-in-polygon to census tract), date/tenure math, cross-fact expressions (e.g., `liquid_assets <= 1.5 * price * 0.03` asset caps).
- **Tri-state output per rule:** pass / fail / unknown (missing fact) → program status: **Eligible · Likely eligible (verify X) · One step away (fixable: education, small savings, document) · Watching (eligible, unfunded) · Not eligible (reason + delta: "over the limit by $4,300")**.
- Fully versioned: every evaluation stores program_version + rule outcomes → auditable, replayable, and legally defensible.
- Performance: full-graph evaluation (household × all in-geo programs) < 500ms via pre-indexed geo shards and compiled rule trees.

## 4.4 Program Stacking Engine
Constraint solver over the eligible set: benefit types (first mortgage, primary DPA, secondary grant, closing help, MCC tax credit, rate buydown, BMR price reduction), pairwise `conflicts_with`, per-program CLTV/total-assistance caps, lender-overlay compatibility. Output: the **optimal stack** (maximize usable dollars subject to constraints) plus ranked alternates with tradeoffs in plain language ("Stack B is $9K less but forgivable in 5 years instead of repayable"). Deterministic, explainable, and re-solved whenever any input changes.

## 4.5 Buying-Power & Affordability Engine
Live rates by product (FHA/VA/USDA/conventional/HFA firsts), MI schedules, county tax rates, insurance estimates by ZIP (wildfire/flood adjusted), HOA. Computes: max price with/without stack, payment at any price, DTI with program seconds correctly treated (deferred = excluded, amortizing = included). Powers listing flags, Snapshot, and the Digital Twin.

## 4.6 HOS™ — Homeownership Opportunity Score
Proprietary 0–1000 score measuring *opportunity*, not just credit.
**Pillars (weights configurable, published):** Financial readiness (credit band, DTI, reserves) 30% · Opportunity access (count and $ of eligible programs at current facts) 25% · Momentum (plan completion, education, savings velocity) 20% · Market fit (buying power vs attainable inventory in target geo) 15% · Stability (income seasoning, tenure) 10%.
**Rules:** transparent formula; every point traceable; always shipped with the top actions and their exact point + dollar impact ("Finish education: +38 HOS, +$40,000 unlocked"). **Never** uses protected attributes or proxies; quarterly disparate-impact audit is a release gate. HOS is a consumer empowerment metric and (with consent) a lead-quality signal for pros — it is *not* a credit score and is never sold as underwriting input.

## 4.7 Homeownership Digital Twin
The defining feature. A standing simulation of each household re-evaluated on every relevant world event:
**Triggers:** program funding opens/closes · income-table refresh · rate moves > 12.5 bps · new listing matching saved intent · user fact change · life event · document expiry · application milestone.
**Actions:** re-run UHEE + stacking + buying power → diff vs last state → if material (config thresholds), generate a Today-feed card + push/SMS/email in user's language → log to twin timeline.
**Modes:** *Active buyer* (real-time), *Getting ready* (weekly digest + plan nudges), *Owner* (refi, property-tax exemptions, repair grants, HELOC alternatives, equity milestones).
Architecture: event-driven (see Vol 9); twin state stored as versioned snapshots for "what changed and why" explainability.

## 4.8 Universal Application Engine
"Complete one profile. Unlock hundreds of opportunities" made literal.
- **Form graph:** every integrated application (lender 1003/MISMO, program PDFs, agency portals) mapped field-by-field to UHP schema.
- **Modes:** (a) native API submission where partners integrate; (b) generated, pre-filled PDF/e-sign packages; (c) guided external flow with a copy-assist overlay where neither exists.
- Consent-scoped: each submission shows exactly which fields go where before the user confirms. Document vault attaches verified docs automatically; conditions flow back into the Applications Hub.
- Dedupes requirements across simultaneous applications ("these 4 applications all need the same 2 paystubs — uploaded once, sent 4 times").

## 4.9 AI Agent Ecosystem
All agents follow: **AI proposes → deterministic systems or humans decide → everything logged.** No agent makes an eligibility, pricing, or routing decision alone.

| ID | Agent | Function | Guardrails |
|----|-------|----------|-----------|
| A1 | Program Intelligence | Crawl/diff/extract programs into NHKG candidates with citations | Human review queue; two-person rule approval |
| A2 | Eligibility Interpreter | Parse ambiguous guideline language into rule proposals; answer "does X count?" for data-ops | Cites source text; confidence thresholds |
| A3 | Document Intelligence | Classify/extract/verify vault documents (paystub → income fields), flag fraud signals | Extractions confirmed by user; fraud flags → human |
| A4 | Guide (consumer copilot) | Conversational Q&A over the user's own results, program docs, plan | RAG over NHKG + user context; refuses legal/tax advice; multilingual; never invents program terms — cites |
| A5 | Intake Interviewer | Adaptive question ordering, plain-language rephrasing, "why we ask" | Question set fixed by product; agent orders/phrases only |
| A6 | Match Quality | Score referral readiness/intent for marketplace routing | No protected attributes; audited for disparate impact |
| A7 | Listing Intelligence | Detect BMR/deed restrictions in listing text, builder incentives, geo-resolve to tract | Flags verified against county records before display |
| A8 | Ops Copilot | Draft support replies, summarize cases, detect anomalies/fraud patterns | Human send; PII-scoped |
| A9 | Impact Analyst | Generate agency/funder narrative reports from utilization data | Numbers from warehouse only; no generation of statistics |

**Model strategy:** frontier LLM (e.g., Claude) for extraction/interpretation/conversation via provider API; small fine-tuned classifiers for document types and listing flags; all prompts + outputs logged; PII minimized/tokenized before any model call; zero training on user data without explicit opt-in; evaluation suites with golden datasets run per release.


---

# VOLUME 5 — HOME DISCOVERY (MLS, MAPS & AFFORDABILITY)

## 5.1 Listing Ingestion
- **RESO Web API** feeds via MLS Grid / Trestle / Bridge across SoCal MLSs first (CRMLS, SDMLS), expanding nationally; IDX compliance per MLS (attribution, refresh SLAs, display rules) enforced by a per-MLS policy engine.
- Off-MLS inventory: builder direct feeds (incentives, spec homes), BMR/CLT inventory from agency + nonprofit portals (often never on MLS — a PreQualy exclusive), HUD Homes, agency dispositions.
- Normalization → geocode → **census-tract resolution** (critical: targeted-area programs raise limits or waive first-time rules by tract) → Listing Intelligence flags (A7) → affordability pre-computation.

## 5.2 The Affordability Layer (the differentiator)
For each user × listing: real monthly (product rate, MI, county tax, ZIP-adjusted insurance, HOA) minus stack effects → flags: `AFFORDABLE_ALONE` · `REACHABLE_WITH_STACK` · `BMR_QUALIFIED` · `BMR_OVER_LIMIT(delta)` · `TARGETED_AREA_BONUS` · `BUILDER_CREDITS` · `ABOVE_POWER(delta)`. Search by *monthly payment*, not just price. Map layers: program geographies, targeted tracts, schools, commute isochrones, opportunity indices.

## 5.3 Tours, Offers & the Pro Handoff
Tour requests route to the user's matched Realtor (or trigger matching). Offer-readiness packet auto-generated for listing agents: buyer's verified buying power, assistance stack with funding reservations, pre-approval — turning "assistance buyers" from perceived risk into documented strength.

---

# VOLUME 6 — MARKETPLACE & PARTNER PORTALS

## 6.1 Professional Marketplace (lenders & Realtors)
- **Verification:** NMLS/DRE license API checks, E&O proof, sanction screening, identity verification; re-verified annually and on license events.
- **Program Certification:** per-program training + assessment; only certified pros receive referrals involving that program. Certification is the marketplace's quality moat.
- **Routing:** consented referral → eligible pro pool (geo + certifications + language + capacity) → ranked by performance score (response time, conversion, buyer ratings, fair-lending-clean outcomes) with round-robin fairness for new pros. Buyers always see 2–3 choices and pick; PreQualy never auto-assigns silently.
- **Pro workspace:** pipeline board, buyer's shared profile (scope-limited), the same Action Plan the buyer sees, secure messaging, document requests into the vault, milestone updates that feed referral tracking, CRM sync (Salesforce, Follow Up Boss, LionDesk), team/branch management for enterprise lenders.

## 6.2 Builder Portal
BMR unit inventory management with income caps and deadlines; incentive publishing (rate buydowns, closing credits) that flows into stacking; eligible-buyer demand heatmaps by tract ("412 PreQualy households qualify for your Fontana community"); lottery/waitlist management for restricted units.

## 6.3 Nonprofit / Counselor Portal
HUD-9902-ready caseload management; client invitations that pre-share consented profiles; education class scheduling with completion sync to client facts; program administration (for nonprofits that run their own DPA); outcome reporting for funders.

## 6.4 Employer Portal
Employer-Assisted Housing (EAH) administration: define benefit (grant/forgivable loan/match), eligibility (tenure, role, geography), budget; employee verification via SSO/HRIS (Workday, ADP) without exposing individual finances to HR; utilization dashboards; benefit appears automatically in employees' UHEE results.

## 6.5 Government Agency Portal
**Program Studio:** publish and maintain programs with a visual rule builder (no code), income-table uploads with HUD auto-refresh, funding meters and cycle scheduling; application intake through the Universal Application Engine with configurable review workflows; **equity dashboards:** utilization by geography/AMI band/demographics (aggregate, privacy-thresholded), unclaimed-funds visibility; export packs for HUD, state HCD, and council reporting. Agencies get their tooling free — their programs *are* the supply side.

## 6.6 Foundation / Funder Dashboards
Where dollars landed (geo, AMI band), leverage ratios (dollars unlocked per grant dollar), longitudinal outcomes; narrative impact reports drafted by A9 from warehouse data.

---

# VOLUME 7 — REVENUE MODEL

**Constitutional constraint: buyers never pay.**

| Stream | Mechanics | Notes |
|--------|----------|-------|
| R1. Qualified referral fees | Pros pay per consented, program-matched, intent-scored introduction; priced by tier (HOS band, stage) | RESPA-safe structure: flat-fee, non-contingent lead pricing for settlement-service providers; broker-model evaluation for success fees with counsel |
| R2. Pro SaaS subscriptions | Workspace tiers: Solo / Team / Enterprise (lender branch mgmt, API, CRM sync, analytics) | Recurring base under referral volume |
| R3. Builder listings & placement | BMR/incentive inventory tools + demand analytics subscriptions | Placement never overrides buyer-fit ranking (Constitution #1) |
| R4. Employer EAH SaaS | Per-employee-per-month benefit administration | HR-budget line, sticky |
| R5. Government/agency contracts | Program Studio is free; paid tiers for application processing at volume, custom reporting, statewide deployments | Also grant-funded pilots (HUD, state HCD) |
| R6. Data & insights (aggregate only) | Market reports, unclaimed-funds indices, policy analytics for institutions | Privacy-thresholded aggregates only; never individual data; never adverse-use (no pricing/underwriting against consumers) |
| R7. Foundation & philanthropic revenue | Sponsored geographies ("brought to your county by X"), outcome-based grants | Funds free-tier expansion |

Unit economics target: CAC via SEO/agency partnerships (near-zero for agency-referred users); referral revenue per closed buyer $1,500–$4,000 blended across lender + Realtor + counselor touches; pro LTV driven by subscription + repeat referrals.

---

# VOLUME 8 — OPERATIONS

## 8.1 Admin Console (internal)
Modules: **Program Ops** (A1 review queues, rule editor with dry-run impact analysis — "this change affects 12,431 users," versioned publish, rollback) · **Data Quality** (freshness SLAs, source-diff monitors, broken-link sweeps) · **Marketplace Ops** (pro verification queue, certification management, performance & complaint review, suspension workflow) · **Trust & Safety** (fraud signals from A3/A8, document-forgery review, account takeover response) · **Support** (omnichannel inbox, A8 draft replies, knowledge base, SLA dashboards) · **Compliance** (consent audit explorer, fair-housing test results, regulator export packs) · **Growth** (campaigns, push/SMS/email orchestration, A/B testing, feature flags) · **BI** (self-serve warehouse dashboards).
RBAC throughout; every admin action audit-logged; two-person rule for program-rule publishes and payout changes.

## 8.2 Support Model
In-app chat (A4-assisted, human-escalated), phone line for low-digital-literacy users, partner support tier for pros/agencies; multilingual; target CSAT ≥ 4.6, first response < 4 business hours.

## 8.3 Data Governance
Data catalog with PII classification; retention schedules (application records 25 months+ per ECOA where applicable; deleted-account purge within 30 days except legal holds); DPIAs for new data uses; quarterly access recertification.


---

# VOLUME 9 — ENGINEERING BLUEPRINT

## 9.1 Architecture Overview
Cloud-native, event-driven microservices; multi-region active-passive (US-West primary), designed for 10M+ households.

```
Clients: Web (Next.js/React) · iOS/Android (React Native) · SMS/IVR
        │  GraphQL BFF + REST/Webhooks for partners (API Gateway, OAuth2/OIDC)
        ▼
Services (each owns its store):
  identity & consent · household-profile (UHP) · knowledge-graph (NHKG)
  rules-engine (UHEE) · stacking · pricing/affordability · listings
  digital-twin (event consumers) · applications · documents/vault
  marketplace & routing · referrals/billing · notifications · portals(agency/employer/builder/nonprofit)
  admin/ops · analytics-ingest
        │
Event backbone: Kafka (topics: fact.changed, program.changed, rate.tick,
  listing.new, application.milestone, consent.changed, twin.recompute)
        │
Data: Postgres (OLTP, RLS) · Neo4j or Postgres+AGE (graph) · OpenSearch (search)
  Redis (cache/rate-limit) · S3+KMS (vault, immutable audit) · Snowflake/BigQuery (warehouse)
AI plane: LLM API (Claude) + small models · prompt/output log store · eval harness
Infra: Kubernetes · Terraform · GitHub Actions CI/CD · canary deploys · feature flags
Observability: OpenTelemetry · Datadog/Grafana · PagerDuty · SLOs (p95 UHEE < 500ms, 99.95% uptime)
```

## 9.2 Core Database Model (representative tables)
```
users(id, auth_id, locale, mfa, created_at)
households(id, owner_user_id, composition_type, consent_state, twin_mode)
household_members(id, household_id, relationship, dob, veteran_json, profession, flags…)
income_sources(id, member_id, type, gross_monthly, verification_level, as_of)
facts(household_id, key, value_json, source, verified_level, as_of)          -- UHEE input
programs(id, slug, admin_org_id, status, current_version_id)
program_versions(id, program_id, rules_json, benefit_json, geo_ref, income_table_ref,
                 stacking_json, citations_json, verified_at, approved_by[2])
income_tables(id, jurisdiction_id, year, size_matrix_json, source_url)
jurisdictions(id, type, parent_id, geo_polygon)                                -- state→county→city→tract
evaluations(id, household_id, program_version_id, outcome, rule_results_json, ts)  -- audit trail
stacks(id, household_id, member_program_ids[], total_benefit, alternates_json, ts)
listings(id, mls_id, source, address, tract_id, price, bmr_json, flags_json, refreshed_at)
listing_affordability(household_id, listing_id, monthly, flags[], computed_at)
professionals(id, org_id, type, license_json, verifications_json, certifications[],
              perf_score, languages[], service_geo)
referrals(id, household_id, professional_id, consent_id, status, milestones_json,
          fee_json, created_at)
consents(id, household_id, grantee_id, scope_fields[], purpose, granted_at, revoked_at)
applications(id, household_id, target_type, target_id, field_map_version,
             status, conditions_json, submitted_at)
documents(id, household_id, class, extraction_json, expires_at, sha256, kms_key_id)
document_shares(document_id, consent_id, recipient_id, watermark_id)
twin_snapshots(household_id, ts, state_json, diff_json, triggers[])
audit_log(actor, action, entity, before, after, ts, ip)                        -- immutable, WORM
```
Row-level security everywhere: households read only their rows; pros read only consented scopes; agencies read only their programs' applications.

## 9.3 Public/Partner API (representative)
```
POST /v1/households                      create profile (partner-embedded intake)
POST /v1/households/{id}/facts           upsert facts → triggers twin recompute
POST /v1/eligibility/evaluate            full UHEE run → outcomes with rule traces
GET  /v1/programs?lat&lng&household=     geo+profile-filtered program search
GET  /v1/programs/{id}                   program with citations & verified_at
POST /v1/stacks/solve                    optimal stack + alternates
GET  /v1/listings?payment_max&flags=     affordability-aware search
POST /v1/referrals                       create consented referral (consent_id required)
POST /v1/referrals/{id}/milestones       pro reports progress (webhooks out)
POST /v1/applications                    universal application submit
GET  /v1/hos/{household_id}              score + action deltas (consumer-consented)
Webhooks: program.updated · funding.changed · referral.milestone · application.status
Agency API: POST /v1/agency/programs (Program Studio programmatic), GET /v1/agency/reports/*
```
Versioned, OAuth2 scopes per persona, idempotency keys, per-partner rate limits, sandbox environment with synthetic households.

## 9.4 Integrations
MLS (RESO via MLSGrid/Trestle/Bridge) · Credit (soft-pull via Experian/TU APIs, FCRA-permissible-purpose gated) · Bank/income (Plaid/Argyle, optional) · E-sign (DocuSign/Dropbox Sign) · LOS (Encompass, Blend via MISMO 3.4) · CRM (Salesforce, Follow Up Boss) · License registries (NMLS Consumer Access, state DRE) · HUD data (AMI releases, counselor roster, HUD Homes) · Rates (Optimal Blue/Polly) · Comms (Twilio, SendGrid) · Payments/payouts (Stripe) · SSO/HRIS for employers (Workday, ADP, Okta).

## 9.5 Security & Compliance
- **Frameworks:** SOC 2 Type II → ISO 27001; GLBA Safeguards Rule program; NIST CSF mapping.
- **Regulatory:** FCRA (permissible purpose, adverse-action-free design — PreQualy screens, never denies credit), ECOA/Reg B & Fair Housing Act (no protected-class use or proxies; quarterly disparate-impact testing on matching, routing, HOS as release gates), RESPA (fee structure legal review, no steering), CCPA/CPRA + state privacy laws (rights built into Consent Center), TCPA (consent-logged SMS), GLBA privacy notices, state MLO/broker licensing analysis per revenue stream, ADA/WCAG 2.2 AA.
- **Controls:** encryption AES-256 at rest (KMS, per-tenant keys for vault) + TLS 1.3; SSN/PII tokenization; secrets in vault; zero-trust service mesh (mTLS); MFA (consumers optional, staff/pros required); quarterly pen tests + continuous bug bounty; immutable WORM audit log; SIEM + 24/7 monitoring; incident response with regulator-notification runbooks; DR: RPO 5 min / RTO 1 hr; vendor risk program.
- **AI safety:** PII minimization before model calls; no training on user data without opt-in; prompt-injection defenses on document/webpage ingestion; human approval on all rule changes; model cards + eval gates per release.

## 9.6 QA & Release
Golden-household regression suite (500+ synthetic households × full program corpus — every rule path asserted); property-based tests on the rules engine; snapshot tests on stack solver; contract tests on partner APIs; accessibility CI; load tests to 50k concurrent evaluations; canary + automatic rollback; program-data changes get their own CI: dry-run impact diff must be reviewed before publish.

---

# VOLUME 10 — ROADMAP & FUTURE VISION

## 10.1 Releases (overlapping workstreams, per the founder's incremental strategy)
**R1 — SoCal Foundation (now → +6 mo):** UHP v1, UHEE with 5-county corpus (the shipped MVP is this release's front end), Snapshot, Action Plan, marketplace v1 (lender/counselor referrals + consent + tracking), document vault v1, admin Program Ops. *Revenue on: referral fees.*
**R2 — Discovery & Applications (+6 → +12 mo):** RESO listings + affordability flags + map, Universal Application v1 (top 20 programs + 1003 pre-fill), Digital Twin v1 (funding/rate/listing alerts), HOS™ v1, agency Program Studio beta (3 SoCal agencies), pro SaaS tiers. *Revenue on: SaaS + builder pilots.*
**R3 — California Statewide (+12 → +20 mo):** all 58 counties via data ops (no re-architecture — Constitution #9), employer EAH portal, nonprofit portal + HUD-9902, Spanish + 5 languages deep, mobile apps, soft-pull credit integration. *Revenue on: employer SaaS, agency contracts.*
**R4 — Multi-state (+20 → +32 mo):** 5-state expansion (TX, FL, GA, AZ, WA candidates by DPA density), national program corpus for statewide/federal programs everywhere, LOS integrations, foundation-sponsored geographies.
**R5 — National OS (+32 mo →):** 50 states, agency API self-serve, policy analytics platform, owner-mode Digital Twin at scale.

## 10.2 Future Vision (design-compatible today)
Predictive homeownership planning (month-by-month path simulation) · AI offer optimization & negotiation support (pro-supervised) · digital closing & (where legal) smart-contract escrow milestones · intergenerational wealth tools (equity → next-generation down payments) · neighborhood intelligence · white-label deployments for state HFAs · research platform for universities & policy makers · international adaptation.

## 10.3 What Success Looks Like
A family in any American county answers ten questions and, within two minutes, sees every dollar and every door that already belongs to them — then a system of record, professionals, and agencies that were built to move them from that moment to keys. Unclaimed assistance stops being a statistic. PreQualy becomes the rails the ecosystem runs on.

---
*Blueprint v1.0 — living document. Companion artifact: `PreQualy_MVP.jsx` (working R1 consumer front end for the five Southern California launch counties).*
