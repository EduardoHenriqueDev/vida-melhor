import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './CuidadorPage.css'
import { FaPlus, FaMinus } from 'react-icons/fa'

interface CuidadorPageProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas') => void
  onBack?: () => void
}

type ProfileRow = {
  id: string
  name: string
  email: string
  phone: string
  role?: boolean
  carer_id?: string | null
}

const CuidadorPage = ({ onSignOut, onNavigate, onBack }: CuidadorPageProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elderly, setElderly] = useState<ProfileRow[]>([])
  const [isCarer, setisCarer] = useState(false)
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState('Usuário')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

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
        setCurrentUserId(user.id)

        // Carrega perfil do usuário
        try {
          const { data: me } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', user.id)
            .maybeSingle()

          const meta = (user?.user_metadata as any) || {}
          const metarole = !!meta?.role

            setisCarer(!!(me as any)?.role || metarole)
            setDisplayName((me as any)?.name || meta?.name || user?.email || 'Usuário')
        } catch {
          const meta = (user?.user_metadata as any) || {}
          setDisplayName(meta?.name || user?.email || 'Usuário')
        }

        // Busca perfis não cuidadores (tenta incluir carer_id; se coluna inexistente ignora)
        let rows: any[] = []
        let fetchErr: any = null
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id,name,email,phone,role,carer_id')
            .not('role', 'eq', true)
            .order('name', { ascending: true })
          rows = data || []
          fetchErr = error
        } catch (e:any) {
          fetchErr = e
        }
        if (fetchErr && /carer_id/i.test(fetchErr.message)) {
          // coluna não existe: refaz sem carer_id
          const { data, error } = await supabase
            .from('profiles')
            .select('id,name,email,phone,role')
            .not('role', 'eq', true)
            .order('name', { ascending: true })
          if (error) throw error
          rows = data || []
        } else if (fetchErr) {
          throw fetchErr
        }
        setElderly(rows as ProfileRow[])
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
      const allowed = ['home', 'profile', 'cuidador', 'pharmacies', 'store', 'consultas']
      const target = allowed.includes(prev) && prev !== 'cuidador' ? prev : 'home'
      onNavigate(target as any)
    } catch {
      onNavigate('home')
    }
  }

  const handleLink = async (elderId: string) => {
    if (!currentUserId) return
    setLinkError(null)
    setLinkingId(elderId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ carer_id: currentUserId })
        .eq('id', elderId)
      if (error) throw error
      setElderly(prev => prev.map(p => p.id === elderId ? { ...p, carer_id: currentUserId } : p))
    } catch (e:any) {
      if (/column .*carer_id/i.test(e?.message || '')) {
        setLinkError('Coluna carer_id inexistente. Crie a coluna em profiles (UUID) e ajuste policies.')
      } else if (e?.code === '42501' || /permission|denied|policy/i.test(e?.message||'')) {
        setLinkError('Sem permissão para vincular (verifique RLS).')
      } else {
        setLinkError(e?.message || 'Falha ao vincular cuidador')
      }
    } finally {
      setLinkingId(null)
    }
  }

  const handleToggleLink = async (elder: ProfileRow) => {
    if (!currentUserId) return
    setLinkError(null)
    setLinkingId(elder.id)
    const alreadyLinked = !!elder.carer_id
    const linkedToMe = elder.carer_id === currentUserId
    try {
      if (alreadyLinked && linkedToMe) {
        // Desvincula
        const { error } = await supabase
          .from('profiles')
          .update({ carer_id: null })
          .eq('id', elder.id)
        if (error) throw error
        setElderly(prev => prev.map(p => p.id === elder.id ? { ...p, carer_id: null } : p))
      } else if (!alreadyLinked) {
        // Vincula reutilizando a função existente
        await handleLink(elder.id)
        return
      }
    } catch (e:any) {
      if (/column .*carer_id/i.test(e?.message || '')) {
        setLinkError('Coluna carer_id inexistente. Crie a coluna em profiles (UUID) e ajuste policies.')
      } else if (e?.code === '42501' || /permission|denied|policy/i.test(e?.message||'')) {
        setLinkError('Sem permissão para vincular/desvincular (verifique RLS).')
      } else {
        setLinkError(e?.message || 'Falha ao atualizar vínculo')
      }
    } finally {
      setLinkingId(null)
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
            {elderly.map((p) => {
              const alreadyLinked = !!p.carer_id
              const linkedToMe = p.carer_id === currentUserId
              return (
                <div key={p.id} className="card">
                  <div className="card-header">
                    <h3 className="name" title={p.name}>{p.name || '—'}</h3>
                    <button
                      type="button"
                      className={`add-elder-btn ${alreadyLinked && linkedToMe ? 'unlink' : ''}`}
                      aria-label={alreadyLinked ? (linkedToMe ? 'Desvincular idoso' : 'Já possui cuidador') : `Vincular ${p.name || 'idoso'}`}
                      title={alreadyLinked ? (linkedToMe ? 'Desvincular' : 'Já possui cuidador') : 'Vincular'}
                      disabled={(alreadyLinked && !linkedToMe) || linkingId === p.id}
                      onClick={() => handleToggleLink(p)}
                    >
                      {linkingId === p.id ? '...' : (alreadyLinked && linkedToMe ? <FaMinus /> : <FaPlus />)}
                    </button>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: 12, color: '#4b5563', wordBreak: 'break-all' }} title={p.email}>{p.email || '—'}</div>
                    <div style={{ fontSize: 12, color: '#4b5563' }} title={formatPhone(p.phone)}>{formatPhone(p.phone) || '—'}</div>
                    {alreadyLinked && (
                      <div style={{ fontSize: 11, marginTop: 4, color: linkedToMe ? 'var(--secondary-color)' : '#6b7280' }}>
                        {linkedToMe ? 'Vinculado a você' : 'Possui cuidador'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Exibe erro de vinculação */}
      {linkError && <div style={{ color:'#b91c1c', padding:'0.5rem 1rem', fontSize:12 }}>{linkError}</div>}

    </div>
  )
}

export default CuidadorPage
