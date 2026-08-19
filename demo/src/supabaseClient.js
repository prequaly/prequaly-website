import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard against a missing/misconfigured env: createClient() throws synchronously
// if called with undefined args, which would crash the entire site at module load
// (this file is imported transitively by the public marketing page), not just the
// news section. Callers must check for `null` and fail soft instead.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
