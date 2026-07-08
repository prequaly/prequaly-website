# PreQualy — The Operating System for Affordable Homeownership
*Opportunity. Access. Home.*

PreQualy connects homebuyers to every housing program, assistance dollar, and
below-market home they qualify for — across government, nonprofit, lender, and
developer sources — then guides them to a verified professional. Buyers are
always free; the platform is a tri-sector venture spanning public agencies,
community organizations, and industry.

**Launch region:** Los Angeles, Orange, Riverside, San Bernardino, and
San Diego counties. National expansion is a data operation, not a rewrite.

## Repository structure
| Path | Contents |
|---|---|
| `CLAUDE.md` | Engineering laws and working rules for AI/dev sessions — read first |
| `prototype/PreQualy_MVP.jsx` | Working single-file consumer prototype (React): deterministic eligibility engine, 25-program corpus, stacking, buying power, home discovery, referrals, interest list |
| `migrations/` | Production PostgreSQL/Supabase schema: `001` schema + RLS + consent enforcement · `002` program/income-table/listing seed · `003` interest list (insert-only) |
| `docs/Master_Build_Prompt.md` | Authoritative 9-phase build specification |
| `docs/Production_Blueprint.md` | Ten-volume long-term platform design |
| `ops/Program_Verification_Workbook.xlsx` | Data-ops source of truth for verifying seeded program figures |

## Quick start
**Prototype (demo):** paste `prototype/PreQualy_MVP.jsx` into any React sandbox
(Loveable, CodeSandbox, Vite + `lucide-react`). It is self-contained.

**Database:** create a Supabase project → SQL Editor → run migrations in order
(001 → 002 → 003). To activate the live interest list, set `SUPABASE_URL` and
`SUPABASE_ANON_KEY` at the top of the prototype file (anon key only — never
`service_role`).

**Full build:** follow `docs/Master_Build_Prompt.md` phase by phase; each phase
is releasable and must pass its quality bars before the next begins.

## Data status
Seeded program figures are **2026 planning estimates** pending source
verification via `ops/Program_Verification_Workbook.xlsx`. Every figure in the
product carries a verified-as-of stamp.

## License
Proprietary — all rights reserved. See `LICENSE`.

---
*Screening only — not a loan approval, credit decision, or legal advice.
Free for homebuyers, always.*
