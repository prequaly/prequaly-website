-- =====================================================================
-- PREQUALY — migration 003: interest list
-- Security model: the public may INSERT (join the list); nobody may
-- SELECT/UPDATE/DELETE through the API. Reading the list is done from
-- the Supabase dashboard or with the service-role key (server only).
-- =====================================================================
create table interest_list (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'website',          -- website | prototype | partner_referral
  county_interest text,
  audience text default 'homebuyer'
    check (audience in ('homebuyer','realtor','lender','nonprofit','government','other')),
  consent_marketing boolean not null default true, -- checked box: "send me updates"
  user_agent text,
  created_at timestamptz not null default now()
);

-- de-duplicate per audience without leaking whether an email exists:
-- unique index + upsert-style insert keeps repeat signups silent
create unique index interest_list_email_audience on interest_list (lower(email), audience);

alter table interest_list enable row level security;

-- anyone (including anonymous visitors) may join the list
create policy interest_insert_public on interest_list
  for insert to anon, authenticated with check (true);

-- NO select/update/delete policies exist on purpose:
-- with RLS enabled and no policy, the API cannot read the list.
-- Staff export via dashboard or service-role only.

comment on table interest_list is
  'Public interest-list signups. Insert-only via API; read via service role. CAN-SPAM: every email sent to this list must include unsubscribe.';
