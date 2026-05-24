import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export async function getSupabaseSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session || null
}

export async function getSupabaseUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user || null
}
