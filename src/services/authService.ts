import { supabase } from '../lib/supabaseClient'

export type SignUpInput = {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
  carer: boolean
}

const PENDING_PROFILE_KEY = 'supabase_pending_profile'

export async function signUpWithProfile(input: SignUpInput) {
  const { name, email, password, cpf, phone, carer } = input

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, cpf, phone, carer },
    },
  })
  if (signUpError) throw signUpError

  const userId = signUpData.user?.id
  const hasSession = !!signUpData.session

  if (userId && hasSession) {
    const { error: insertError } = await supabase
      .from('users')
      .upsert({ id: userId, name, email, cpf, phone, carer })
    if (insertError) throw insertError
  } else {
    // salva perfil pendente para criar após a confirmação e primeiro login
    try {
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({ id: userId, name, email, cpf, phone, carer })
      )
    } catch {}
  }

  return signUpData
}

export async function ensureUserProfile() {
  const { data: userResp } = await supabase.auth.getUser()
  const user = userResp?.user
  if (!user) return

  // Verifica se já existe
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return

  // Monta dados a partir do metadata e fallback do localStorage
  let name = (user.user_metadata as any)?.name || ''
  let cpf = (user.user_metadata as any)?.cpf || ''
  let phone = (user.user_metadata as any)?.phone || ''

  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY)
    if (raw) {
      const pending = JSON.parse(raw)
      name = name || pending?.name || ''
      cpf = cpf || pending?.cpf || ''
      phone = phone || pending?.phone || ''
    }
  } catch {}

  const email = user.email || ''

  if (!name && !cpf && !phone) {
    // Sem dados suficientes, não tenta criar
    return
  }

  const { error: upsertError } = await supabase
    .from('users')
    .upsert({ id: user.id, name, email, cpf, phone })

  if (!upsertError) {
    try { localStorage.removeItem(PENDING_PROFILE_KEY) } catch {}
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}
