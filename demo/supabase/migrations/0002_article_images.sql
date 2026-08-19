-- Adds image support to articles: an ordered array of public image URLs that
-- render inside the article description, plus the Supabase Storage bucket
-- they're uploaded to from the /editarticles admin page.
-- Run by hand in the Supabase SQL editor for the qpwmfbviwpjtwcqbpkky project,
-- after 0001_articles.sql.

alter table articles
  add column image_urls text[] not null default '{}';

-- Public bucket: article images are shown on the public marketing site, so
-- reads don't need auth. Uploads/updates/deletes are restricted to
-- authenticated staff, mirroring the articles table policies in 0001.
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

create policy article_images_select_public on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'article-images');

create policy article_images_insert_authenticated on storage.objects
  for insert to authenticated
  with check (bucket_id = 'article-images');

create policy article_images_update_authenticated on storage.objects
  for update to authenticated
  using (bucket_id = 'article-images')
  with check (bucket_id = 'article-images');

create policy article_images_delete_authenticated on storage.objects
  for delete to authenticated
  using (bucket_id = 'article-images');
