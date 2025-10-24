import { useState, useEffect } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Home from './pages/Home/Home'
import './App.css'
import { supabase } from './lib/supabaseClient'
import { ensureUserProfile } from './services/authService'
import Profile from './pages/Profile/Profile'
import CuidadorPage from './pages/CuidadorPage/CuidadorPage'
import Pharmacies from './pages/Pharmacies/Pharmacies'
import Store from './pages/Store/Store'
import Consultas from './pages/Consultas/Consultas'

function App() {
  const [currentPage, setCurrentPage] = useState<
    'login' | 'register' | 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas'
  >('login')

  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
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

  const handleNavigate = (
    page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas'
  ) => setCurrentPage(page)

  if (!bootstrapped) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Carregando...
        </div>
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
        <CuidadorPage
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'pharmacies' && (
        <Pharmacies onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} />
      )}

      {currentPage === 'store' && (
        <Store onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} />
      )}

      {currentPage === 'consultas' && (
        <Consultas onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} />
      )}
    </div>
  )
}

export default App

