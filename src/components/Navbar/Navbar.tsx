import { IoMdMenu } from "react-icons/io";
import './Navbar.css'

interface NavbarProps {
    onSignOut: () => void
    onOpenMenu?: () => void
    displayName?: string // deixado opcional; não é mais usado aqui
}

const Navbar = ({ onOpenMenu }: NavbarProps) => {
    return (
        <header className="home-header">
            <div className="home-left">
                {/* substitui o texto de boas-vindas pela logo */}
                <img src="/logo.png" alt="Logo" className="nav-logo" />
            </div>
            <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
                <IoMdMenu className="icon" />
            </button>
        </header>
    )
}

export default Navbar