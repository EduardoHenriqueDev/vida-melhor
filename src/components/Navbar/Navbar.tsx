import { IoMdMenu } from "react-icons/io";
import './Navbar.css'

interface NavbarProps {
    onSignOut: () => void
    onOpenMenu?: () => void
    onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store') => void
    displayName?: string
}

const Navbar = ({ onOpenMenu, onNavigate }: NavbarProps) => {
    const goHome = () => { try { localStorage.setItem('last_page','home') } catch {}; onNavigate?.('home') }
    return (
        <header className="home-header">
            <div className="home-left">
                {/* substitui o texto de boas-vindas pela logo */}
                <img src="/logo.png" alt="Logo" className="nav-logo clickable" onClick={goHome} role="link" aria-label="Ir para a Home" />
            </div>
            <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
                <IoMdMenu className="icon" />
            </button>
        </header>
    )
}

export default Navbar