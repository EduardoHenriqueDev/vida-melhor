import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import './Home.css'

interface HomeProps {
  onSignOut: () => void
}

const Home = ({ onSignOut }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(name || user?.email || 'Usuário')
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <img src="/logo.png" alt="Logo" className="home-logo" />
        <button className="signout-button" onClick={handleSignOut}>Sair</button>
      </header>

      <main className="home-main">
        <h2 className="home-title">Bem-vindo, {displayName}</h2>
        <p className="home-subtitle">Você está logado.</p>
      </main>
    </div>
  )
}

export default Home