import './Sidebar.css'

interface SidebarProps {
  open: boolean
  displayName: string
  onClose: () => void
  onSignOut: () => void
}

const Sidebar = ({ open, displayName, onClose, onSignOut }: SidebarProps) => {
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
          <p className="sidebar-welcome">Olá, {displayName}</p>
          <button className="signout-button" onClick={onSignOut}>Sair</button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar