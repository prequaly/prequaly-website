-- =====================================================================
-- PREQUALY — Supabase migration 001: schema, functions, RLS
-- Run order: 001_schema.sql → 002_seed.sql
-- Laws: rules are data; RLS on every table; consent gates all sharing.
-- =====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
-- create extension if not exists postgis;  -- enable when tract polygons load (R2)

-- ---------- helpers
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'consumer' check (role in
    ('consumer','professional','agency_admin','nonprofit','employer_admin','builder','prequaly_admin','prequaly_ops')),
  locale text not null default 'en',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function get_my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(get_my_role() in ('prequaly_admin','prequaly_ops'), false) $$;

-- ---------- Universal Housing Profile
create table households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  composition_type text default 'single',
  county text, city text,
  target_price numeric(12,2), monthly_debts numeric(12,2) default 0,
  twin_mode text not null default 'getting_ready'
    check (twin_mode in ('active_buyer','getting_ready','owner')),
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on households(owner_id);
create index on households(county);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  relationship text not null default 'self',
  birth_year int,
  is_veteran boolean default false,
  veteran_json jsonb,
  profession text,
  counts_toward_income boolean default true,
  created_at timestamptz not null default now()
);
create index on household_members(household_id);

create table income_sources (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references household_members(id) on delete cascade,
  type text not null,
  gross_monthly numeric(12,2) not null,
  verification_level text not null default 'self_stated'
    check (verification_level in ('self_stated','doc_verified','bank_verified')),
  as_of date default current_date
);

create table facts (
  household_id uuid not null references households(id) on delete cascade,
  key text not null,
  value jsonb not null,
  source text not null default 'intake',
  verified_level text default 'self_stated',
  as_of timestamptz not null default now(),
  primary key (household_id, key)
);

-- ---------- Knowledge graph
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null check (org_type in ('government','nonprofit','lender','developer','employer','foundation')),
  website text
);

create table jurisdictions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('state','county','city','tract')),
  name text not null,
  parent_id uuid references jurisdictions(id)
  -- geom geometry(MultiPolygon,4326)  -- R2, with postgis
);
create index on jurisdictions(kind, name);

create table income_tables (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  year int not null,
  matrix jsonb not null,          -- {"1":76800,...} or {"Los Angeles":{...},"default":...}
  source_url text,
  verified_at date
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  admin_org_id uuid references organizations(id),
  source_type text not null check (source_type in ('government','nonprofit','lender','developer')),
  status text not null default 'active' check (status in
    ('active','active_verify','waitlist','lottery_closed','funds_exhausted','archived')),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table program_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  version int not null default 1,
  geo_include jsonb not null default '[]',
  geo_exclude jsonb not null default '[]',
  rules jsonb not null default '[]',
  benefit jsonb not null default '{}',
  stacking jsonb not null default '{}',
  docs_required jsonb not null default '[]',
  blurb text,
  citations jsonb not null default '[]',
  verified_at date,
  approved_by uuid[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (program_id, version)
);
alter table programs add constraint fk_current_version
  foreign key (current_version_id) references program_versions(id) deferrable initially deferred;

create table funding_cycles (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  opens_at date, closes_at date,
  budget numeric(14,2), remaining numeric(14,2)
);

-- ---------- Evaluations (audit trail)
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  program_version_id uuid not null references program_versions(id),
  outcome text not null check (outcome in
    ('eligible','likely_eligible','one_step','watching','not_eligible','not_in_area')),
  rule_results jsonb not null default '[]',
  benefit_estimate numeric(12,2) default 0,
  ts timestamptz not null default now()
);
create index on evaluations(household_id, ts desc);

create table stacks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  program_ids uuid[] not null,
  total_benefit numeric(12,2) not null default 0,
  alternates jsonb not null default '[]',
  ts timestamptz not null default now()
);

create table hos_scores (
  household_id uuid primary key references households(id) on delete cascade,
  score int not null check (score between 0 and 1000),
  components jsonb not null,
  actions jsonb not null default '[]',
  ts timestamptz not null default now()
);

-- ---------- Listings & saves
create table listings (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  mls_id text,
  address text not null, city text not null, county text not null,
  tract_id text,
  lat numeric(9,6), lng numeric(9,6),
  price numeric(12,2) not null, market_value numeric(12,2),
  beds int, baths numeric(3,1), sqft int,
  flag text not null default 'standard' check (flag in ('standard','bmr','new_construction')),
  bmr jsonb, incentives jsonb, photos jsonb,
  status text not null default 'active',
  note text,
  refreshed_at timestamptz not null default now()
);
create index on listings(county, status);

create table saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('program','listing')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

-- ---------- Marketplace, consent, referrals
create table professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  full_name text not null, org_name text not null,
  pro_type text not null check (pro_type in ('lender','realtor','counselor','builder_rep')),
  license_no text, license_state text, license_verified_at date,
  languages text[] not null default '{English}',
  service_counties text[] not null default '{}',
  certifications uuid[] not null default '{}',
  rating numeric(2,1), closed_count int default 0, capacity int default 10,
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  grantee_type text not null check (grantee_type in ('professional','agency','employer')),
  grantee_id uuid not null,
  scope_fields text[] not null,
  purpose text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index on consents(household_id);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  professional_id uuid not null references professionals(id),
  consent_id uuid not null references consents(id),
  status text not null default 'requested' check (status in
    ('requested','matched','contacted','preapproved','in_contract','closed','withdrawn')),
  milestones jsonb not null default '[]',
  fee jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function enforce_live_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from consents c
    where c.id = new.consent_id
      and c.household_id = new.household_id
      and c.revoked_at is null
  ) then
    raise exception 'Referral requires an active consent for this household';
  end if;
  return new;
end $$;
create trigger referrals_require_consent
  before insert on referrals for each row execute function enforce_live_consent();

-- ---------- Applications & documents
create table applications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  target_type text not null check (target_type in ('program','lender')),
  target_id uuid not null,
  status text not null default 'draft' check (status in
    ('draft','submitted','in_review','conditions','approved','denied','withdrawn')),
  field_snapshot jsonb not null default '{}',
  conditions jsonb not null default '[]',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  class text, storage_path text not null, sha256 text,
  extraction jsonb, expires_at date, verified boolean default false,
  created_at timestamptz not null default now()
);

create table document_shares (
  document_id uuid not null references documents(id) on delete cascade,
  consent_id uuid not null references consents(id),
  recipient_id uuid not null,
  shared_at timestamptz not null default now(),
  primary key (document_id, consent_id)
);

-- ---------- Twin, notifications, plan
create table twin_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  trigger text not null, diff jsonb not null default '{}',
  material boolean not null default false,
  ts timestamptz not null default now()
);
create index on twin_events(household_id, ts desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, title text not null, body text,
  cta_route text, read_at timestamptz,
  ts timestamptz not null default now()
);
create index on notifications(user_id, read_at);

create table plan_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  key text not null, label text not null, why text,
  hos_delta int default 0, dollars_delta numeric(12,2) default 0,
  done_at timestamptz,
  unique (household_id, key)
);

-- ---------- Ops & AI
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid, action text not null, entity text not null, entity_id text,
  before jsonb, after jsonb, ts timestamptz not null default now()
);
create table ai_logs (
  id bigint generated always as identity primary key,
  agent text not null, user_id uuid,
  prompt_hash text, input_summary text, output jsonb,
  ts timestamptz not null default now()
);
create table program_change_queue (
  id uuid primary key default gen_random_uuid(),
  source_url text not null, detected_diff text,
  proposed_rules jsonb, confidence numeric(3,2),
  status text not null default 'needs_review'
    check (status in ('needs_review','approved','rejected')),
  reviewer_id uuid, ts timestamptz not null default now()
);

-- updated_at triggers
do $$ declare t text;
begin
  foreach t in array array['profiles','households','programs','professionals','referrals','applications']
  loop execute format('create trigger %I_touch before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- =====================================================================
-- ROW-LEVEL SECURITY
-- =====================================================================
alter table profiles enable row level security;
create policy profiles_self on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_self_up on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'consumer');

alter table households enable row level security;
create policy hh_owner_all on households for all
  using (owner_id = auth.uid() or is_staff()) with check (owner_id = auth.uid() or is_staff());

alter table household_members enable row level security;
create policy hm_owner on household_members for all
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));

alter table income_sources enable row level security;
create policy is_owner on income_sources for all
  using (exists (select 1 from household_members m join households h on h.id = m.household_id
                 where m.id = member_id and (h.owner_id = auth.uid() or is_staff())));

alter table facts enable row level security;
create policy facts_owner on facts for all
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));

alter table evaluations enable row level security;
create policy eval_owner on evaluations for select
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));
alter table stacks enable row level security;
create policy stacks_owner on stacks for select
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));
alter table hos_scores enable row level security;
create policy hos_owner on hos_scores for select
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));

-- public read of published catalog
alter table programs enable row level security;
create policy programs_public on programs for select using (status <> 'archived');
create policy programs_admin on programs for all using (is_staff());
alter table program_versions enable row level security;
create policy pv_public on program_versions for select using (published = true);
create policy pv_admin on program_versions for all using (is_staff());
alter table income_tables enable row level security;
create policy it_public on income_tables for select using (true);
create policy it_admin on income_tables for all using (is_staff());
alter table funding_cycles enable row level security;
create policy fc_public on funding_cycles for select using (true);
create policy fc_admin on funding_cycles for all using (is_staff());
alter table jurisdictions enable row level security;
create policy jur_public on jurisdictions for select using (true);
alter table organizations enable row level security;
create policy org_public on organizations for select using (true);
create policy org_admin on organizations for all using (is_staff());
alter table listings enable row level security;
create policy listings_public on listings for select using (status = 'active');
create policy listings_admin on listings for all using (is_staff());

alter table saved_items enable row level security;
create policy saved_self on saved_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table professionals enable row level security;
create policy pros_public_read on professionals for select using (status = 'approved' or user_id = auth.uid() or is_staff());
create policy pros_self_update on professionals for update using (user_id = auth.uid() or is_staff());
create policy pros_admin_ins on professionals for insert with check (is_staff());

alter table consents enable row level security;
create policy consent_owner on consents for all
  using (exists (select 1 from households h where h.id = household_id and h.owner_id = auth.uid()) or is_staff());

alter table referrals enable row level security;
create policy ref_owner on referrals for select
  using (exists (select 1 from households h where h.id = household_id and h.owner_id = auth.uid())
         or exists (select 1 from professionals p where p.id = professional_id and p.user_id = auth.uid())
         or is_staff());
create policy ref_owner_ins on referrals for insert
  with check (exists (select 1 from households h where h.id = household_id and h.owner_id = auth.uid()));
create policy ref_pro_up on referrals for update
  using (exists (select 1 from professionals p where p.id = professional_id and p.user_id = auth.uid()) or is_staff());

alter table applications enable row level security;
create policy app_owner on applications for all
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));
alter table documents enable row level security;
create policy doc_owner on documents for all
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));
alter table document_shares enable row level security;
create policy ds_owner on document_shares for all
  using (exists (select 1 from documents d join households h on h.id = d.household_id
                 where d.id = document_id and (h.owner_id = auth.uid() or is_staff())));

alter table twin_events enable row level security;
create policy twin_owner on twin_events for select
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));
alter table notifications enable row level security;
create policy notif_self on notifications for all
  using (user_id = auth.uid() or is_staff());
alter table plan_items enable row level security;
create policy plan_owner on plan_items for all
  using (exists (select 1 from households h where h.id = household_id and (h.owner_id = auth.uid() or is_staff())));

alter table audit_log enable row level security;
create policy audit_admin on audit_log for select using (is_staff());
alter table ai_logs enable row level security;
create policy ai_admin on ai_logs for select using (is_staff());
alter table program_change_queue enable row level security;
create policy pcq_admin on program_change_queue for all using (is_staff());

-- Consent-scoped pro access to a referred household (the ONLY pro read path)
create or replace function get_referral_household(p_referral_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'household', to_jsonb(h) - 'owner_id',
    'facts', (select coalesce(jsonb_object_agg(f.key, f.value), '{}'::jsonb)
              from facts f join consents c on c.id = r.consent_id
              where f.household_id = h.id and f.key = any(c.scope_fields)))
  into v
  from referrals r
  join households h on h.id = r.household_id
  join professionals p on p.id = r.professional_id
  join consents c on c.id = r.consent_id and c.revoked_at is null
  where r.id = p_referral_id and p.user_id = auth.uid();
  if v is null then raise exception 'Not authorized or consent revoked'; end if;
  return v;
end $$;
