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
import { getMedications, type Medication } from '../../services/medicationsService'

interface HomeProps {
  onSignOut: () => void
  onNavigate: (
    page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications'
  ) => void
}

const Home = ({ onSignOut, onNavigate }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [isCarer, setIsCarer] = useState(false)
  const { count } = useCart()
  const [meds, setMeds] = useState<Medication[]>([])
  const [medsLoading, setMedsLoading] = useState(true)
  const [medsError, setMedsError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(name || user?.email || 'Usuário')
      setIsCarer(!!(user?.user_metadata as any)?.carer)
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
        const all = await getMedications()
        setMeds(all.slice(0, 4))
      } catch (e: any) {
        setMedsError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setMedsLoading(false)
      }
    }
    loadMeds()
  }, [])

  const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />

      <div className="home-welcome">
        <div className="welcome">
          <span className="welcome-top">Bem-vindo(a),</span>
          <span className="welcome-name">{displayName}</span>
        </div>
        <CartIcon count={count} />
      </div>

      <div className="home-toolbar">
        <SearchBar />
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
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="med-card skeleton" />
            ))}
          {!medsLoading && medsError && <div className="med-error">{medsError}</div>}
          {!medsLoading &&
            !medsError &&
            meds.map((m) => (
              <button
                key={m.id}
                type="button"
                className="med-card mini"
                role="listitem"
                aria-label={`Ver ${m.name}`}
                onClick={() => onNavigate('medications')}
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

      <div className="home-bottom">
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
          <button type="button" className="home-action-button" aria-label="Consultas">
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
          <div className="home-carer">
            <button
              type="button"
              className="home-action-button carer"
              aria-label="Cuidador"
              onClick={() => onNavigate('cuidador')}
            >
              <FaUser className="icon" />
              <span>Cuidador</span>
            </button>
          </div>
        )}

        <div className="home-emergency">
          <button type="button" className="home-action-button emergency" aria-label="Emergência">
            <MdEmergency className="icon" />
            <span>Emergência</span>
          </button>
        </div>
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