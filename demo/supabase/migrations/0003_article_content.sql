-- Adds full-article support to articles: a byline, a real calendar publish date,
-- a sanitized-HTML body for a full read page, and a slug for the /articles/{slug}
-- route. Supersedes the display_month/display_year pair from 0001_articles.sql.
-- Run by hand in the Supabase SQL editor for the qpwmfbviwpjtwcqbpkky project,
-- after 0001_articles.sql and 0002_article_images.sql.

alter table articles
  add column author text not null default '',
  add column published_date date not null default current_date,
  add column body_html text not null default '',
  add column slug text unique;

-- Backfill published_date from the old month/year pair (first of the month),
-- then existing rows carry a sane real date instead of the current-date default.
update articles
  set published_date = make_date(display_year, display_month, 1);

-- Give the known seed article a clean, human-readable slug.
update articles
  set slug = 'prequaly-advances-in-the-ace-pitch-program'
  where slug is null
    and title = 'PreQualy Advances in the ACE Pitch Program';

-- Any other pre-existing article (e.g. created via /editarticles before this
-- migration) gets a slug generated from its title, with a short id suffix to
-- guarantee uniqueness without a collision-detection loop.
update articles
  set slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
             || '-' || substr(id::text, 1, 8)
  where slug is null;

alter table articles
  alter column slug set not null;

drop index if exists articles_sort_idx;
create index articles_sort_idx on articles (published_date desc, created_at desc);

alter table articles
  drop column display_month,
  drop column display_year;

comment on column articles.author is 'Byline shown on the card and the full article page.';
comment on column articles.body_html is
  'Sanitized HTML for the full /articles/{slug} page. Sanitize again at render time — this column is defense in depth, not a trust boundary on its own.';
comment on column articles.slug is 'URL segment for /articles/{slug}. Generated from the title at creation time.';
