import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './Home.css'

interface HomeProps {
  onSignOut: () => void
}

const Home = ({ onSignOut }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)

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
      <Navbar displayName={displayName} onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />

      <Sidebar open={open} displayName={displayName} onClose={() => setOpen(false)} onSignOut={handleSignOut} />

      <main className="home-main">
        <h2 className="home-title">Bem-vindo, {displayName}</h2>
        <p className="home-subtitle">Você está logado.</p>
      </main>
    </div>
  )
}

export default Home