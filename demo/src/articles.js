import { supabase } from './supabaseClient.js'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const TYPE_LABELS = {
  news: 'News & Update',
  press: 'Press Release',
}

export function formatDisplayDate(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export async function fetchPublishedArticles() {
  if (!supabase) {
    return { data: [], error: new Error('Supabase is not configured.') }
  }
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('display_year', { ascending: false })
    .order('display_month', { ascending: false })
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}
