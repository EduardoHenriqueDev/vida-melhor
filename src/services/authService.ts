import { supabase } from '../lib/supabaseClient'

export type SignUpInput = {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
  role: boolean
}

export type SignUpPayload = {
  name: string
  email: string
  cpf: string
  phone: string
  password: string
  role: boolean
}

const PENDING_PROFILE_KEY = 'supabase_pending_profile'

export async function signUpWithProfile(input: SignUpInput) {
  const cleanName = input.name.trim()
  const cleanCpf = input.cpf.replace(/\D/g, '')
  const cleanPhone = input.phone.replace(/\D/g, '')
  const { email, password, role } = input

  if (!email || !password) throw new Error('E-mail e senha são obrigatórios')
  if (password.length < 6) throw new Error('Senha deve ter ao menos 6 caracteres')
  if (!cleanName) throw new Error('Nome é obrigatório')
  if (cleanCpf.length !== 11) throw new Error('CPF deve ter 11 dígitos')
  if (cleanPhone.length < 10) throw new Error('Telefone incompleto')

  // Tenta criação com redirect de confirmação de e-mail
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { name: cleanName, role }, // metadados mínimos
    },
  })
  if (signUpError) {
    console.error('[signUpWithProfile] signup 1 falhou:', { status: (signUpError as any).status, message: signUpError.message })
    try { await supabase.auth.signOut() } catch {}
    const { data: retryData, error: retryErr } = await supabase.auth.signUp({ email, password })
    if (retryErr) {
      console.error('[signUpWithProfile] signup fallback falhou:', { status: (retryErr as any).status, message: retryErr.message })
      const raw = retryErr.message || ''
      if (/duplicate|unique/i.test(raw)) throw new Error('E-mail já cadastrado')
      throw new Error('Falha ao criar usuário (500). Tente novamente em alguns minutos.')
    }
    if (!retryData.user) throw new Error('Usuário não retornado')
    return await upsertProfileAfterSignup(retryData.user, { email, cleanName, cleanCpf, cleanPhone, role })
  }

  if (!signUpData.user) throw new Error('Usuário não retornado')
  return await upsertProfileAfterSignup(signUpData.user, { email, cleanName, cleanCpf, cleanPhone, role })
}

async function upsertProfileAfterSignup(user: any, { email, cleanName, cleanCpf, cleanPhone, role }: { email: string; cleanName: string; cleanCpf: string; cleanPhone: string; role: boolean }) {
  // Verifica se já existe (trigger pode ter criado) e só cria se faltar
  let exists = false
  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
    exists = !!existing
  } catch { exists = false }

  if (!exists) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email || email, name: cleanName, cpf: cleanCpf, phone: cleanPhone, role })
    if (profileError) {
      console.error('[signUpWithProfile] upsert perfil erro:', profileError.message)
      const raw = profileError.message || ''
      if (/cpf.*unique|unique.*cpf/i.test(raw)) throw new Error('CPF já cadastrado')
      // não aborta totalmente: retorna usuário mesmo assim
    }
  }
  return user
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
  } catch { }

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
    } catch { }
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
