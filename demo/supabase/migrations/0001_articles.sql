-- articles: News & Updates + Press Releases shown on the public site,
-- managed from the /editarticles admin page. Public read, authenticated write.
-- Run by hand in the Supabase SQL editor for the qpwmfbviwpjtwcqbpkky project.

create table articles (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('news', 'press')),   -- 'news' = News & Updates, 'press' = Press Release
  title text not null,
  description text not null,
  link_url text,
  display_month smallint not null check (display_month between 1 and 12),
  display_year  smallint not null check (display_year between 2000 and 2100),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_sort_idx on articles (display_year desc, display_month desc, created_at desc);

create or replace function set_articles_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger articles_touch_updated_at
  before update on articles
  for each row execute function set_articles_updated_at();

alter table articles enable row level security;

-- Public read: anyone (including anonymous site visitors) can view all articles.
-- No draft/unpublished concept — every row in this table is published.
create policy articles_select_public on articles
  for select to anon, authenticated using (true);

-- Writes restricted to authenticated users. Any authenticated account is trusted
-- (small team, manually-created accounts only) — no per-row ownership check.
create policy articles_insert_authenticated on articles
  for insert to authenticated with check (true);

create policy articles_update_authenticated on articles
  for update to authenticated using (true) with check (true);

create policy articles_delete_authenticated on articles
  for delete to authenticated using (true);

comment on table articles is
  'Public News & Updates / Press Release content for the marketing site. Public SELECT, writes require Supabase Auth.';

-- Seed: carry the existing hardcoded article forward so the public page doesn't regress.
insert into articles (type, title, description, link_url, display_month, display_year)
values (
  'news',
  'PreQualy Advances in the ACE Pitch Program',
  'PreQualy is continuing to develop its vision for a more accessible homeownership ecosystem, helping first-time and working-class homebuyers better identify affordable homeownership opportunities and resources.',
  'https://www.instagram.com/p/DTOBxKXjzfM/',
  8, 2026
);

-- Manual follow-up steps (not automatable from this file):
-- 1. In Supabase Dashboard -> Authentication -> Settings, disable "Allow new user signups".
--    The anon key is public by design, so leaving signups open would let anyone create
--    an authenticated session and pass the write policies above.
-- 2. In Supabase Dashboard -> Authentication -> Users, manually add an account for each
--    authorized staff member (email + password, mark email confirmed).
