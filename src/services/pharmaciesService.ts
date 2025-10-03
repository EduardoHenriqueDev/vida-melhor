import { supabase } from '../lib/supabaseClient'

export type Pharmacy = {
  id: string
  name: string
  address: string | null
  contact: string | null
  email: string
  email_verified: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export async function getPharmacies(): Promise<Pharmacy[]> {
  // Garante sessão e usa o JWT no header Authorization
  const { data: sessionResp } = await supabase.auth.getSession()
  const session = sessionResp.session
  if (!session) throw new Error('Não autenticado')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const url = `${supabaseUrl}/rest/v1/pharmacies?select=id,name,address,contact,email,email_verified,active,created_at,updated_at&order=name.asc`

  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao buscar farmácias: ${res.status} ${text}`)
  }

  const data = (await res.json()) as Pharmacy[]
  return data
}
