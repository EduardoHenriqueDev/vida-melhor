import { supabase } from '../lib/supabaseClient'

export type Medication = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  is_generic: boolean
  pharmacy_id: string
  stock: number
  price_in_cents: number
  created_at: string
}

export async function getstore(): Promise<Medication[]> {
  const { data: sessionResp } = await supabase.auth.getSession()
  const session = sessionResp.session
  if (!session) throw new Error('Não autenticado')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const url = `${supabaseUrl}/rest/v1/medications?select=id,name,slug,description,category_id,is_generic,pharmacy_id,stock,price_in_cents,created_at&order=name.asc`

  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao buscar medicamentos: ${res.status} ${text}`)
  }

  return (await res.json()) as Medication[]
}
