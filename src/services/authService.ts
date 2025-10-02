import { supabase } from '../lib/supabaseClient'

export type SignUpInput = {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
}

const PENDING_PROFILE_KEY = 'supabase_pending_profile'

export async function signUpWithProfile(input: SignUpInput) {
  const cleanName = input.name.trim()
  const cleanCpf = input.cpf.replace(/\D/g, '')
  const cleanPhone = input.phone.replace(/\D/g, '')
  const { email, password } = input

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: cleanName, cpf: cleanCpf, phone: cleanPhone },
    },
  })
  if (signUpError) throw signUpError

  const userId = signUpData.user?.id
  let upserted = false

  if (userId) {
    // tenta criar/atualizar o perfil imediatamente
    const { error: insertError } = await supabase
      .from('users')
      .upsert({ id: userId, name: cleanName, email, cpf: cleanCpf, phone: cleanPhone })
    upserted = !insertError
  }

  if (!upserted) {
    // salva perfil pendente para criar após a confirmação e primeiro login
    try {
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({ id: userId, name: cleanName, email, cpf: cleanCpf, phone: cleanPhone })
      )
    } catch {}
  } else {
    try { localStorage.removeItem(PENDING_PROFILE_KEY) } catch {}
  }

  return signUpData
}

export async function ensureUserProfile() {
  const { data: userResp } = await supabase.auth.getUser()
  const user = userResp?.user
  if (!user) return

  // Fetch existing to merge values (avoid blanking fields)
  const { data: existing } = await supabase
    .from('users')
    .select('id, name, email, cpf, phone')
    .eq('id', user.id)
    .maybeSingle()

  // Prefer inputs saved at sign-up (localStorage), then metadata
  let pending: Partial<{ name: string; cpf: string; phone: string }> = {}
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY)
    if (raw) pending = JSON.parse(raw) ?? {}
  } catch {}

  const meta = (user.user_metadata as any) || {}

  const inputName = (pending.name ?? '').toString().trim()
  const inputCpf = (pending.cpf ?? '').toString().replace(/\D/g, '')
  const inputPhone = (pending.phone ?? '').toString().replace(/\D/g, '')

  const metaName = (meta.name ?? '').toString().trim()
  const metaCpf = (meta.cpf ?? '').toString().replace(/\D/g, '')
  const metaPhone = (meta.phone ?? '').toString().replace(/\D/g, '')

  // Build payload prioritizing: inputs > metadata > existing
  const payload = {
    id: user.id,
    name: inputName || metaName || existing?.name || '',
    email: user.email || existing?.email || '',
    cpf: inputCpf || metaCpf || existing?.cpf || '',
    phone: inputPhone || metaPhone || existing?.phone || '',
  }

  const { error: upsertError } = await supabase.from('users').upsert(payload)

  if (!upsertError) {
    try {
      localStorage.removeItem(PENDING_PROFILE_KEY)
    } catch {}
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
