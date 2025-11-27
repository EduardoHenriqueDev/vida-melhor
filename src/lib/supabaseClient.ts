import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '')
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes.'
  )
  throw new Error(
    'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
