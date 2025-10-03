import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './Home.css'
import SearchBar from '../../components/SearchBar/SearchBar'
import { FaClinicMedical, FaCalendarAlt, FaPills } from 'react-icons/fa'
import CartIcon from '../../components/CartIcon/CartIcon'
import { MdEmergency } from 'react-icons/md'
import { useCart } from '../../contexts/CartContext'

interface HomeProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'pharmacies' | 'medications') => void
}

const Home = ({ onSignOut, onNavigate }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const { count } = useCart() // + cart count

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(name || user?.email || 'Usuário')
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

      <div className="home-actions">
        <button type="button" className="home-action-button primary" aria-label="Farmácias" onClick={() => onNavigate('pharmacies')}>
          <FaClinicMedical className="icon" />
          <span>Farmácias</span>
        </button>
        <button type="button" className="home-action-button" aria-label="Consultas">
          <FaCalendarAlt className="icon" />
          <span>Consultas</span>
        </button>
        <button type="button" className="home-action-button" aria-label="Medicamentos" onClick={() => onNavigate('medications')}>
          <FaPills className="icon" />
          <span>Medicamentos</span>
        </button>
      </div>

      <div className="home-emergency">
        <button type="button" className="home-action-button emergency" aria-label="Emergência">
          <MdEmergency className="icon" />
          <span>Emergência</span>
        </button>
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