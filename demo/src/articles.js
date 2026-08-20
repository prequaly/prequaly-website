import { supabase } from './supabaseClient.js'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const TYPE_LABELS = {
  news: 'News & Update',
  press: 'Press Release',
}

export function hasArticleBody(article) {
  return !!(article.body_html && article.body_html.trim() && article.body_html !== '<p></p>')
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

export async function fetchPublishedArticles() {
  if (!supabase) {
    return { data: [], error: new Error('Supabase is not configured.') }
  }
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false })
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function fetchArticleBySlug(slug) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return { data, error }
}

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'article'
}

// Generates a slug from the title that doesn't collide with an existing article.
export async function generateUniqueSlug(title, { excludeId } = {}) {
  const base = slugify(title)
  if (!supabase) return base
  let candidate = base
  let suffix = 2
  for (;;) {
    let query = supabase.from('articles').select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}
