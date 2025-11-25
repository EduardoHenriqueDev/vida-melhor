import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './Home.css'
import SearchBar from '../../components/SearchBar/SearchBar'
import { FaClinicMedical, FaCalendarAlt, FaPills, FaUser } from 'react-icons/fa'
import CartIcon from '../../components/CartIcon/CartIcon'
import { MdEmergency } from 'react-icons/md'
import { useCart } from '../../contexts/CartContext'

type HomeMedicineRow = {
  id: number
  nome: string
  dose: string
  estoque: number
  ultima_dose: string | null
  frequencia_horas?: number | null
}

interface HomeProps {
  onSignOut: () => void
  onNavigate: (
    page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas' | 'medications'
  ) => void
}

// Tipo para consultas conforme tabela public.consultation
interface ConsultationRow {
  id: string
  name: string
  date: string
  type: string
  doctor_name: string
  specialty: string
}

const Home = ({ onSignOut, onNavigate }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [isCarer, setisCarer] = useState(false)
  const { count } = useCart()
  const [userId, setUserId] = useState<string>('')
  const [meds, setMeds] = useState<HomeMedicineRow[]>([])
  const [medsLoading, setMedsLoading] = useState(true)
  const [medsError, setMedsError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
  const [consultations, setConsultations] = useState<ConsultationRow[]>([])
  const [consultLoading, setConsultLoading] = useState(true)
  const [consultError, setConsultError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [medsFound, setMedsFound] = useState<any[]>([])
  const [pharmsFound, setPharmsFound] = useState<any[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      let profileName: string | undefined
      if (user?.id) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()
        if (!error) profileName = (prof as any)?.name
      }
      const metaName = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(profileName || metaName || user?.email || 'Usuário')
      setisCarer(!!(user?.user_metadata as any)?.role)
      setUserId(user?.id || '')
    }
    loadUser()
  }, [])

  useEffect(() => {
    const ensureSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) onSignOut()
      } catch (e) {
        console.error('Erro verificando sessão (Home):', e)
        onSignOut()
      }
    }
    ensureSession()
  }, [onSignOut])

  // Carrega medicamentos do usuário logado
  useEffect(() => {
    if (!userId) return
    const loadMeds = async () => {
      setMedsLoading(true)
      setMedsError(null)
      try {
        const { data, error } = await supabase
          .from('medicines')
          .select('id,nome,dose,estoque,ultima_dose,frequencia_horas')
          .eq('user_id', userId)
          .order('id', { ascending: false })
        if (error) throw error
        setMeds((data as HomeMedicineRow[]) || [])
      } catch (e: any) {
        setMedsError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setMedsLoading(false)
      }
    }
    loadMeds()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const loadConsults = async () => {
      setConsultLoading(true); setConsultError(null)
      try {
        let rows: ConsultationRow[] = []
        if (isCarer) {
          // busca ids dos idosos vinculados
          const { data: elders, error: eldersErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('carer_id', userId)
          if (eldersErr) throw eldersErr
          const ids = (elders || []).map(e => (e as any).id)
          if (ids.length === 0) {
            rows = []
          } else {
            const { data: consults, error: consultErr } = await supabase
              .from('consultation')
              .select('id,name,date,type,doctor_name,specialty')
              .in('user_id', ids)
              .order('date', { ascending: false })
            if (consultErr) throw consultErr
            rows = (consults as ConsultationRow[]) || []
          }
        } else {
          const { data, error } = await supabase
            .from('consultation')
            .select('id,name,date,type,doctor_name,specialty')
            .eq('user_id', userId)
            .order('date', { ascending: false })
          if (error) throw error
          rows = (data as ConsultationRow[]) || []
        }
        setConsultations(rows)
      } catch (e: any) {
        setConsultError(e?.message || 'Erro ao carregar consultas')
      } finally { setConsultLoading(false) }
    }
    loadConsults()
  }, [userId, isCarer])

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setMedsFound([])
      setPharmsFound([])
      setSearchError(null)
      return
    }
    let active = true
    setSearching(true)
    setSearchError(null)
    const handler = setTimeout(async () => {
      try {
        const term = `%${searchTerm.trim()}%`
        const [medsResp, pharmsResp] = await Promise.all([
          supabase.from('store').select('id,name,slug,description,is_generic,stock,price_in_cents,category_id,pharmacy_id,created_at').ilike('name', term).limit(8),
          supabase.from('pharmacies').select('id,name,email,address,contact,active').ilike('name', term).limit(8)
        ])
        if (!active) return
        if (medsResp.error) throw medsResp.error
        if (pharmsResp.error) throw pharmsResp.error
        setMedsFound((medsResp.data as any[]) || [])
        setPharmsFound(pharmsResp.data || [])
      } catch (e: any) {
        if (active) setSearchError(e?.message || 'Erro na busca')
      } finally {
        if (active) setSearching(false)
      }
    }, 300)
    return () => { active = false; clearTimeout(handler) }
  }, [searchTerm])

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  useEffect(() => {
    const listener = (e: any) => { if(e?.detail?.name) setDisplayName(e.detail.name) }
    window.addEventListener('profile-updated', listener)
    return () => window.removeEventListener('profile-updated', listener)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('last_page','home') } catch {}
  }, [])

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />

      <div className="home-welcome">
        <div className="welcome">
          <a
            href="#"
            className="welcome-link"
            onClick={(e) => { e.preventDefault(); onNavigate('profile') }}
            title="Ir para o perfil"
          >
            <span className="welcome-top">Bem-vindo(a),</span>{' '}<span className="welcome-name">{displayName}</span>
          </a>
        </div>
        <CartIcon count={count} />
      </div>

      <div className="home-toolbar">
        <SearchBar
          value={searchTerm}
          onChange={(v) => setSearchTerm(v)}
          onSubmit={() => { /* opcional: manter comportamento */ }}
        />
        {(searchTerm.trim().length >= 2) && (
          <div className="search-results" aria-live="polite">
            {searching && <div className="search-status">Buscando...</div>}
            {!searching && searchError && <div className="search-error">{searchError}</div>}
            {!searching && !searchError && (medsFound.length === 0 && pharmsFound.length === 0) && (
              <div className="search-empty">Nenhum resultado</div>
            )}
            {!searching && !searchError && medsFound.length > 0 && (
              <div className="search-group">
                <div className="group-title">Medicamentos</div>
                <ul className="group-list">
                  {medsFound.map(m => (
                    <li key={m.id}>
                      <button type="button" className="search-item" onClick={() => onNavigate('store')}>
                        <span className="item-name" title={m.name}>{m.name}</span>
                        {m.stock > 0 ? (
                          <span className="item-meta">{m.stock} un • {(m.price_in_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
                        ) : (
                          <span className="item-meta out-of-stock">Fora de estoque</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!searching && !searchError && pharmsFound.length > 0 && (
              <div className="search-group">
                <div className="group-title">Farmácias</div>
                <ul className="group-list">
                  {pharmsFound.map(p => (
                    <li key={p.id}>
                      <button type="button" className="search-item" onClick={() => onNavigate('pharmacies')}>
                        <span className="item-name" title={p.name}>{p.name}</span>
                        {p.address && <span className="item-meta" title={p.address}>{p.address}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="home-banner">
        <img src="/banner.png" alt="Banner" />
      </div>

      <div className="home-medicines">
        <div className="meds-header">
          <h3 className="meds-title">Medicamentos</h3>
          <button
            type="button"
            className="see-all"
            onClick={() => onNavigate('medications')}
          >
            Ver tudo
          </button>
        </div>
        <div className="meds-row" role="list">
          {medsLoading &&
            Array.from({ length: isDesktop ? 6 : 4 }).map((_, i) => (
              <div key={i} className="med-card skeleton" />
            ))}
          {!medsLoading && medsError && <div className="med-error">{medsError}</div>}
          {!medsLoading && !medsError && meds.slice(0, isDesktop ? 6 : 4).map((m) => (
            <button
              key={m.id}
              type="button"
              className="med-card mini"
              role="listitem"
              aria-label={`Ver ${m.nome}`}
              onClick={() => onNavigate('medications')}
            >
              <div className="med-mini-header">
                <span className="med-name" title={m.nome}>
                  {m.nome}
                </span>
              </div>
              <span className="med-desc" title={`Dose: ${m.dose}`}>
                Dose: {m.dose}
              </span>
              <div className="med-meta-line">
                <span className="med-stock">Estoque: {m.estoque}</span>
                {typeof m.frequencia_horas === 'number' && m.frequencia_horas > 0 && (
                  <span className="med-price">{m.frequencia_horas}h</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {isDesktop && (
        <div className="home-consultations">
          <div className="consult-header">
            <h3 className="consult-title">Consultas</h3>
            <button type="button" className="see-all" onClick={() => onNavigate('consultas')}>Ver tudo</button>
          </div>
          <div className="consult-row" role="list" aria-label="Lista de consultas">
            {consultLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="consult-card skeleton" />
            ))}
            {!consultLoading && consultError && <div className="consult-error" role="alert">{consultError}</div>}
            {!consultLoading && !consultError && consultations.slice(0,6).map(c => (
              <button
                key={c.id}
                type="button"
                className="consult-card"
                role="listitem"
                aria-label={`Ver consulta ${c.name}`}
                onClick={() => onNavigate('consultas')}
              >
                <span className="consult-name" title={c.name}>{c.name}</span>
                <div className="consult-meta-line">
                  <span className="consult-date" title={c.date}>{new Date(c.date).toLocaleString('pt-BR')}</span>
                  <span className="consult-type" title={c.type}>{c.type}</span>
                </div>
                <div className="consult-meta-line">
                  <span className="consult-doc" title={`Médico: ${c.doctor_name}`}>{c.doctor_name}</span>
                  <span className="consult-spec" title={`Especialidade: ${c.specialty}`}>{c.specialty}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="home-bottom">
        <div className="home-emergency">
          <button type="button" className="home-action-button emergency" aria-label="Emergência">
            <MdEmergency className="icon" />
            <span>Emergência</span>
          </button>
        </div>
        <div className="home-actions">
          <button
            type="button"
            className="home-action-button primary"
            aria-label="Consultas"
            onClick={() => onNavigate('pharmacies')}
          >
            <FaClinicMedical className="icon" />
            <span>Farmácias</span>
          </button>
          <button type="button" className="home-action-button" aria-label="Consultas" onClick={() => onNavigate('consultas')}>
            <FaCalendarAlt className="icon" />
            <span>Consultas</span>
          </button>
          <button
            type="button"
            className="home-action-button"
            aria-label="Medicamentos"
            onClick={() => onNavigate('medications')}
          >
            <FaPills className="icon" />
            <span>Medicamentos</span>
          </button>
        </div>
        {isCarer && (
          <div className="home-role">
            <button
              type="button"
              className="home-action-button role"
              aria-label="Cuidador"
              onClick={() => onNavigate('cuidador')}
            >
              <FaUser className="icon" />
              <span>Cuidador</span>
            </button>
          </div>
        )}
      </div>

      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={onNavigate}
        activePage="home"
      />
    </div>
  )
}

export default Home