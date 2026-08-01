-- =============================================================================
-- PreQualy — Supabase Schema
-- Run this entire script once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: future_homebuyers
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.future_homebuyers (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  source            text        not null    default 'interest-landing-page',

  -- Contact info
  full_name         text,
  email             text        not null,
  phone             text,

  -- Location
  state             text,
  county            text,

  -- Homebuyer-specific fields
  timeline          text,                   -- "Within 6 months", "1–2 years", etc.
  first_time        text,                   -- "Yes" / "No"
  household_size    integer,
  housing_status    text,                   -- "Renting", "Living with family", etc.
  interests         text[]      default '{}',  -- multi-select checkboxes

  -- Spam prevention
  submitted_at      timestamptz,            -- client-provided timestamp
  ip_address        inet,                   -- populated server-side if desired
  user_agent        text
);

-- Indexes for dashboard queries
create index if not exists future_homebuyers_created_at_idx  on public.future_homebuyers (created_at desc);
create index if not exists future_homebuyers_state_idx       on public.future_homebuyers (state);
create index if not exists future_homebuyers_county_idx      on public.future_homebuyers (county);

-- Enable Row Level Security
alter table public.future_homebuyers enable row level security;

-- Dashboard can read (anon key)
create policy "Dashboard can read homebuyers"
  on public.future_homebuyers for select
  to anon
  using (true);

-- Only the service-role key (Edge Function) can insert — RLS bypassed by service role
-- No explicit INSERT policy needed; service role bypasses RLS by default.


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: government_agencies
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.government_agencies (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  source            text        not null    default 'interest-landing-page',

  -- Contact info
  agency_name       text,
  contact_name      text,
  email             text        not null,
  phone             text,
  title             text,

  -- Location
  state             text,
  county            text,

  -- Agency-specific fields
  agency_type       text,                   -- "City", "County", "State", "Federal"
  familiarity       text,                   -- familiarity with homeownership programs
  pilot_interest    text,                   -- interest in pilot collaboration
  notes             text,

  -- Spam prevention
  submitted_at      timestamptz,
  ip_address        inet,
  user_agent        text
);

create index if not exists government_agencies_created_at_idx on public.government_agencies (created_at desc);
create index if not exists government_agencies_state_idx      on public.government_agencies (state);

alter table public.government_agencies enable row level security;

create policy "Dashboard can read agencies"
  on public.government_agencies for select
  to anon
  using (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: nonprofits
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.nonprofits (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  source            text        not null    default 'interest-landing-page',

  -- Contact info
  organization_name text,
  contact_name      text,
  email             text        not null,
  phone             text,
  title             text,

  -- Location
  state             text,
  county            text,

  -- Nonprofit-specific fields
  mission_area      text,                   -- primary mission area
  populations       text[]      default '{}',  -- populations served (multi-select)
  interests         text[]      default '{}',  -- partnership interests (multi-select)

  -- Spam prevention
  submitted_at      timestamptz,
  ip_address        inet,
  user_agent        text
);

create index if not exists nonprofits_created_at_idx on public.nonprofits (created_at desc);
create index if not exists nonprofits_state_idx      on public.nonprofits (state);

alter table public.nonprofits enable row level security;

create policy "Dashboard can read nonprofits"
  on public.nonprofits for select
  to anon
  using (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4: real_estate_professionals
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.real_estate_professionals (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  source            text        not null    default 'interest-landing-page',

  -- Contact info
  full_name         text,
  email             text        not null,
  phone             text,

  -- Location
  state             text,
  county            text,

  -- RE Pro-specific fields
  profession        text,                   -- "Agent", "Broker", "Loan Officer", etc.
  company           text,
  title             text,
  markets           text,                   -- service area / markets description
  experience        integer,                -- years of experience
  annual_clients    text,                   -- "1–10", "11–25", "25+" etc.
  interests         text[]      default '{}',  -- partnership interests (multi-select)

  -- Spam prevention
  submitted_at      timestamptz,
  ip_address        inet,
  user_agent        text
);

create index if not exists real_estate_professionals_created_at_idx on public.real_estate_professionals (created_at desc);
create index if not exists real_estate_professionals_state_idx      on public.real_estate_professionals (state);

alter table public.real_estate_professionals enable row level security;

create policy "Dashboard can read real estate pros"
  on public.real_estate_professionals for select
  to anon
  using (true);


-- =============================================================================
-- VERIFICATION QUERIES (run after the script to confirm setup)
-- =============================================================================
-- select count(*) from public.future_homebuyers;
-- select count(*) from public.government_agencies;
-- select count(*) from public.nonprofits;
-- select count(*) from public.real_estate_professionals;
