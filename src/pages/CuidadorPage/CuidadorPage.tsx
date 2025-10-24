import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './CuidadorPage.css'

interface CuidadorPageProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications') => void
  onBack?: () => void
}

type ProfileRow = {
  id: string
  name: string
  email: string
  phone: string
  carer?: boolean
}

const CuidadorPage = ({ onSignOut, onNavigate, onBack }: CuidadorPageProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elderly, setElderly] = useState<ProfileRow[]>([])
  const [isCarer, setIsCarer] = useState(false)
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState('Usuário')

  // Formata telefone para exibição
  const formatPhone = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11)
    if (!d) return ''
    const ddd = d.slice(0, 2)
    const r = d.slice(2)
    if (d.length <= 6) return `(${ddd}) ${r}`
    if (d.length <= 10) return `(${ddd}) ${r.slice(0, 4)}-${r.slice(4)}`
    return `(${ddd}) ${r.slice(0, 5)}-${r.slice(5)}`
  }

  // Guarda a página anterior para facilitar navegação
  useEffect(() => {
    try {
      const prev = localStorage.getItem('last_page')
      if (prev) localStorage.setItem('prev_page', prev)
      localStorage.setItem('last_page', 'cuidador')
    } catch {}
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: userResp } = await supabase.auth.getUser()
        const user = userResp.user
        if (!user) throw new Error('Sessão expirada')

        // Carrega perfil do usuário
        try {
          const { data: me } = await supabase
            .from('profiles')
            .select('carer, name')
            .eq('id', user.id)
            .maybeSingle()

          const meta = (user?.user_metadata as any) || {}
          const metaCarer = !!meta?.carer

          setIsCarer(!!(me as any)?.carer || metaCarer)
          setDisplayName((me as any)?.name || meta?.name || user?.email || 'Usuário')
        } catch {
          const meta = (user?.user_metadata as any) || {}
          setDisplayName(meta?.name || user?.email || 'Usuário')
        }

        // Busca todos os perfis que não são cuidadores
        const { data, error } = await supabase
          .from('profiles')
          .select('id,name,email,phone,carer')
          .not('carer', 'eq', true)
          .order('name', { ascending: true })

        if (error) throw error
        setElderly((data || []) as ProfileRow[])
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar lista de idosos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleBack = () => {
    if (onBack) return onBack()
    try {
      const prev = localStorage.getItem('prev_page') as any
      const allowed = ['home', 'profile', 'cuidador', 'pharmacies', 'medications']
      const target = allowed.includes(prev) && prev !== 'cuidador' ? prev : 'home'
      onNavigate(target as any)
    } catch {
      onNavigate('home')
    }
  }

  return (
    <div className="cuidador-container">
      <Navbar displayName={displayName} onSignOut={onSignOut} onOpenMenu={() => setOpen(true)} />
      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        activePage="cuidador"
      />

      <div className="cuidador-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Cuidador</h2>
      </div>

      {loading && <div style={{ color: '#374151', padding: '0 1rem' }}>Carregando...</div>}
      {!loading && error && (
        <div style={{ color: '#b91c1c', fontSize: '0.95rem', padding: '0 1rem' }}>{error}</div>
      )}

      {!loading && !error && (
        elderly.length === 0 ? (
          <div style={{ color: '#374151', padding: '0 1rem' }}>
            Nenhum idoso encontrado.
            {isCarer && (
              <>
                <br />
                <small style={{ color: '#6b7280' }}>
                  Se você é cuidador e continua vendo isso, habilite a policy no Supabase para cuidadores listarem idosos.
                </small>
              </>
            )}
          </div>
        ) : (
          <div className="grid">
            {elderly.map((p) => (
              <div key={p.id} className="card">
                <div className="card-body">
                  <h3 className="name" title={p.name}>{p.name || '—'}</h3>
                  <div style={{ fontSize: 12, color: '#4b5563', wordBreak: 'break-all' }} title={p.email}>{p.email || '—'}</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }} title={formatPhone(p.phone)}>{formatPhone(p.phone) || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default CuidadorPage
