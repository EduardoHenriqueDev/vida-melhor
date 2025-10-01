import { IoMdMenu } from "react-icons/io";
import './Navbar.css'

interface NavbarProps {
    displayName: string
    onSignOut: () => void
    onOpenMenu?: () => void
}

const Navbar = ({ displayName, onOpenMenu }: NavbarProps) => {
    return (
        <header className="home-header">
            <div className="home-left">
                <span className="welcome">Bem-vindo, {displayName}</span>
            </div>
            <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
                <IoMdMenu />
            </button>
        </header>
    )
}

export default Navbar