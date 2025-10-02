import './Sidebar.css'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { IoLogOutOutline } from 'react-icons/io5'

interface SidebarProps {
  open: boolean
  displayName: string
  onClose: () => void
  onSignOut: () => void
  onNavigate?: (page: 'home' | 'profile') => void // + navigation callback
}

const Sidebar = ({ open, displayName, onClose, onSignOut, onNavigate }: SidebarProps) => {
  const [name, setName] = useState<string>(displayName)
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const metaName = (user?.user_metadata as any)?.name as string | undefined
      setName(displayName || metaName || user?.email || 'Usuário')
      setEmail(user?.email || '')
    }
    load()
  }, [displayName])

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <button className="sidebar-close" onClick={onClose} aria-label="Fechar menu">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          {/* perfil: avatar + nome + email */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
              </svg>
            </div>
            <div className="sidebar-identity">
              <div className="sidebar-name">{name}</div>
              <div className="sidebar-email">{email}</div>
            </div>
          </div>

          {/* links */}
          <nav className="sidebar-nav" aria-label="Menu lateral">
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => { e.preventDefault(); onNavigate?.('home'); onClose(); }}
            >
              Home
            </a>
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => { e.preventDefault(); onNavigate?.('profile'); onClose(); }}
            >
              Perfil
            </a>
            <a href="#" className="sidebar-link" onClick={onClose}>Medicamentos</a>
            <a href="#" className="sidebar-link" onClick={onClose}>Farmácias</a>
            <a href="#" className="sidebar-link" onClick={onClose}>Consultas</a>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="signout-button" onClick={onSignOut}>
            <IoLogOutOutline className="icon" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar