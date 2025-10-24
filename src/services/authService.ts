import { supabase } from '../lib/supabaseClient'

export type SignUpInput = {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
  role: boolean
}

const PENDING_PROFILE_KEY = 'supabase_pending_profile'

export async function signUpWithProfile(input: SignUpInput) {
  // 🧼 Limpa os campos
  const cleanName = input.name.trim()
  const cleanCpf = input.cpf.replace(/\D/g, '')
  const cleanPhone = input.phone.replace(/\D/g, '')
  const { email, password, role } = input

  // 🧾 Cria conta no Supabase Auth com metadados
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: cleanName, cpf: cleanCpf, phone: cleanPhone, role },
    },
  })
  if (signUpError) throw signUpError

  const userId = signUpData.user?.id
  let upserted = false

  if (userId) {
    // Tenta inserir perfil imediatamente
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: cleanName,
        email,
        cpf: cleanCpf,
        phone: cleanPhone,
        role,
      })

    upserted = !insertError
  }

  // Se não deu pra salvar agora, salva localmente para depois
  if (!upserted) {
    try {
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          id: userId,
          name: cleanName,
          email,
          cpf: cleanCpf,
          phone: cleanPhone,
          role,
        })
      )
    } catch {}
  } else {
    try {
      localStorage.removeItem(PENDING_PROFILE_KEY)
    } catch {}
  }

  return signUpData
}

export async function ensureUserProfile() {
  const { data: userResp } = await supabase.auth.getUser()
  const user = userResp?.user
  if (!user) return

  // Busca dados já existentes
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, name, email, cpf, phone, role')
    .eq('id', user.id)
    .maybeSingle()

  // Busca dados pendentes salvos localmente
  let pending: Partial<{ name: string; cpf: string; phone: string; role: boolean }> = {}
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY)
    if (raw) pending = JSON.parse(raw) ?? {}
  } catch {}

  const meta = (user.user_metadata as any) || {}

  const inputName = (pending.name ?? '').toString().trim()
  const inputCpf = (pending.cpf ?? '').toString().replace(/\D/g, '')
  const inputPhone = (pending.phone ?? '').toString().replace(/\D/g, '')
  const inputrole = pending.role ?? meta.role ?? existing?.role ?? false

  const metaName = (meta.name ?? '').toString().trim()
  const metaCpf = (meta.cpf ?? '').toString().replace(/\D/g, '')
  const metaPhone = (meta.phone ?? '').toString().replace(/\D/g, '')

  // Monta payload final com prioridade: pendente > metadata > existente
  const payload = {
    id: user.id,
    name: inputName || metaName || existing?.name || '',
    email: user.email || existing?.email || '',
    cpf: inputCpf || metaCpf || existing?.cpf || '',
    phone: inputPhone || metaPhone || existing?.phone || '',
    role: inputrole,
  }

  const { error: upsertError } = await supabase.from('profiles').upsert(payload)

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
