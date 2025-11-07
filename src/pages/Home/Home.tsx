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
import { getstore, type Medication } from '../../services/storeService'
import { getPharmacies } from '../../services/pharmaciesService'

interface HomeProps {
  onSignOut: () => void
  onNavigate: (
    page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas'
  ) => void
}

const Home = ({ onSignOut, onNavigate }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [isCarer, setisCarer] = useState(false)
  const { count } = useCart()
  const [meds, setMeds] = useState<Medication[]>([])
  const [medsLoading, setMedsLoading] = useState(true)
  const [medsError, setMedsError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [pharmLoading, setPharmLoading] = useState(true)
  const [pharmError, setPharmError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [medsFound, setMedsFound] = useState<Medication[]>([])
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

  useEffect(() => {
    const loadMeds = async () => {
      setMedsLoading(true)
      setMedsError(null)
      try {
        const all = await getstore()
        setMeds(all.slice(0, 4))
      } catch (e: any) {
        setMedsError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setMedsLoading(false)
      }
    }
    loadMeds()
  }, [])

  useEffect(() => {
    const loadPharmacies = async () => {
      setPharmLoading(true)
      setPharmError(null)
      try {
        const all = await getPharmacies()
        setPharmacies(all)
      } catch (e: any) {
        setPharmError(e?.message ?? 'Erro ao carregar farmácias')
      } finally {
        setPharmLoading(false)
      }
    }
    loadPharmacies()
  }, [])

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
        setMedsFound((medsResp.data as Medication[]) || [])
        setPharmsFound(pharmsResp.data || [])
      } catch (e: any) {
        if (active) setSearchError(e?.message || 'Erro na busca')
      } finally {
        if (active) setSearching(false)
      }
    }, 300)
    return () => { active = false; clearTimeout(handler) }
  }, [searchTerm])

  const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
    try {
      const last = localStorage.getItem('last_page')
      if (last && last !== 'home') {
        onNavigate(last as any)
        return
      }
    } catch {}
    try { localStorage.setItem('last_page', 'home') } catch {}
  }, [onNavigate])

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
            onClick={() => onNavigate('store')}
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
          {!medsLoading &&
            !medsError &&
            meds.slice(0, isDesktop ? 6 : 4).map((m) => (
              <button
                key={m.id}
                type="button"
                className="med-card mini"
                role="listitem"
                aria-label={`Ver ${m.name}`}
                onClick={() => onNavigate('store')}
              >
                <div className="med-mini-header">
                  <span className="med-name" title={m.name}>
                    {m.name}
                  </span>
                  <span className={`badge ${m.is_generic ? 'generic' : 'brand'}`}>
                    {m.is_generic ? 'Genérico' : 'Marca'}
                  </span>
                </div>
                {m.description && (
                  <span className="med-desc" title={m.description}>
                    {m.description}
                  </span>
                )}
                <div className="med-meta-line">
                  <span className="med-stock">Estoque: {m.stock}</span>
                  <span className="med-price">{formatPrice(m.price_in_cents)}</span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {isDesktop && (
        <div className="home-pharmacies">
          <div className="pharm-header">
            <h3 className="pharm-title">Farmácias</h3>
            <button type="button" className="see-all" onClick={() => onNavigate('pharmacies')}>
              Ver tudo
            </button>
          </div>
          <div className="pharm-row" role="list" aria-label="Lista de farmácias">
            {pharmLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pharm-card skeleton" />
            ))}
            {!pharmLoading && pharmError && <div className="pharm-error">{pharmError}</div>}
            {!pharmLoading && !pharmError && pharmacies.slice(0, 6).map(p => (
              <button
                key={p.id}
                type="button"
                className="pharm-card"
                role="listitem"
                aria-label={`Ver farmácia ${p.name}`}
                onClick={() => onNavigate('pharmacies')}
              >
                <span className="pharm-name" title={p.name}>{p.name}</span>
                {p.email && <span className="pharm-email" title={p.email}>{p.email}</span>}
                {p.address && <span className="pharm-address" title={p.address}>{p.address}</span>}
                {p.contact && <span className="pharm-contact" title={p.contact}>{p.contact}</span>}
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
            aria-label="Farmácias"
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
            onClick={() => onNavigate('store')}
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