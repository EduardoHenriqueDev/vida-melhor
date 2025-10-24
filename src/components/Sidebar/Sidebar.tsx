import './Sidebar.css'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { IoLogOutOutline } from 'react-icons/io5'

interface SidebarProps {
  open: boolean
  displayName: string
  onClose: () => void
  onSignOut: () => void
  onNavigate?: (page: 'home' | 'profile' | 'pharmacies' | 'medications' | 'cuidador') => void
  activePage?: 'home' | 'profile' | 'pharmacies' | 'medications' | 'cuidador'
}

const Sidebar = ({ open, displayName, onClose, onSignOut, onNavigate, activePage }: SidebarProps) => {
  const [name, setName] = useState<string>(displayName)
  const [email, setEmail] = useState<string>('')
  const [isCarer, setIsCarer] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const metaName = (user?.user_metadata as any)?.name as string | undefined
      let profileName: string | undefined

      if (user?.id) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('name, carer')
          .eq('id', user.id)
          .maybeSingle()

        if (!error) {
          profileName = (prof as any)?.name
          setIsCarer(!!(prof as any)?.carer)
        }
      }

      setName(profileName || displayName || metaName || user?.email || 'Usuário')
      setEmail(user?.email || '')
      if (!profileName) setIsCarer(!!(user?.user_metadata as any)?.carer)
    }

    load()
  }, [displayName])

  useEffect(() => {
    const handler = (e: any) => { if (e?.detail?.name) setName(e.detail.name) }
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

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
          {/* Perfil */}
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

          {/* Links */}
          <nav className="sidebar-nav" aria-label="Menu lateral">
            <a
              href="#"
              className={`sidebar-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); try{localStorage.setItem('last_page','home')}catch{}; onNavigate?.('home'); onClose(); }}
            >
              Home
            </a>
            <a
              href="#"
              className={`sidebar-link ${activePage === 'profile' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); try{localStorage.setItem('last_page','profile')}catch{}; onNavigate?.('profile'); onClose(); }}
            >
              Perfil
            </a>
            <a
              href="#"
              className={`sidebar-link ${activePage === 'medications' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); try{localStorage.setItem('last_page','medications')}catch{}; onNavigate?.('medications'); onClose(); }}
            >
              Medicamentos
            </a>
            <a
              href="#"
              className={`sidebar-link ${activePage === 'pharmacies' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); try{localStorage.setItem('last_page','pharmacies')}catch{}; onNavigate?.('pharmacies'); onClose(); }}
            >
              Farmácias
            </a>

            {/* Exibe “Cuidador” apenas se o usuário for cuidador */}
            {isCarer && (
              <a
                href="#"
                className={`sidebar-link ${activePage === 'cuidador' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); try{localStorage.setItem('last_page','cuidador')}catch{}; onNavigate?.('cuidador'); onClose(); }}
              >
                Cuidador
              </a>
            )}

            <a href="#" className="sidebar-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
              Consultas
            </a>
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
