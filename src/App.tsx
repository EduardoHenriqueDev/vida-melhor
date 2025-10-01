import { useState } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Home from './pages/Home/Home'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'home'>('login')

  const handleSwitchToRegister = () => setCurrentPage('register')
  const handleSwitchToLogin = () => setCurrentPage('login')
  const handleLoginSuccess = () => setCurrentPage('home')
  const handleSignOut = () => setCurrentPage('login')

  return (
    <div className="app">
      {currentPage === 'login' && (
        <Login onSwitchToRegister={handleSwitchToRegister} onLoginSuccess={handleLoginSuccess} />
      )}
      {currentPage === 'register' && (
        <Register onSwitchToLogin={handleSwitchToLogin} />
      )}
      {currentPage === 'home' && (
        <Home onSignOut={handleSignOut} />
      )}
    </div>
  )
}

export default App
