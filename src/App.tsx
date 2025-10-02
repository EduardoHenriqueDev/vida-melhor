import { useState, useEffect } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Home from './pages/Home/Home'
import './App.css'
import { supabase } from './lib/supabaseClient'
import { ensureUserProfile } from './services/authService'
import Profile from './pages/Profile/Profile'
import CuidadorPage from './pages/CuidadorPage/CuidadorPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'home' | 'profile' | 'cuidador'>('login')
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // não bloqueia a UI carregando perfil
          ensureUserProfile().catch(console.error)
        }
        setCurrentPage(session ? 'home' : 'login')
      } catch (e) {
        console.error('Erro ao inicializar sessão:', e)
        setCurrentPage('login')
      } finally {
        setBootstrapped(true)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        if (session) {
          ensureUserProfile().catch(console.error)
        }
        setCurrentPage(session ? 'home' : 'login')
      } catch (e) {
        console.error('Erro no onAuthStateChange:', e)
        setCurrentPage('login')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSwitchToRegister = () => setCurrentPage('register')
  const handleSwitchToLogin = () => setCurrentPage('login')
  const handleLoginSuccess = () => setCurrentPage('home')
  const handleSignOut = () => setCurrentPage('login')
  const handleNavigate = (page: 'home' | 'profile' | 'cuidador') => setCurrentPage(page)

  // loading simples para evitar tela branca
  if (!bootstrapped) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {currentPage === 'login' && (
        <Login onSwitchToRegister={handleSwitchToRegister} onLoginSuccess={handleLoginSuccess} />
      )}
      {currentPage === 'register' && (
        <Register onSwitchToLogin={handleSwitchToLogin} />
      )}
      {currentPage === 'home' && (
        <Home onSignOut={handleSignOut} onNavigate={handleNavigate} />
      )}
      {currentPage === 'profile' && (
        <Profile onSignOut={handleSignOut} onNavigate={handleNavigate} />
      )}
      {currentPage === 'cuidador' && (
        <CuidadorPage onSignOut={handleSignOut} onNavigate={handleNavigate} />
      )}
    </div>
  )
}

export default App
