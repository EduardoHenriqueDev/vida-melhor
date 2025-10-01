import { useState } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login')

  const handleSwitchToRegister = () => {
    setCurrentPage('register')
  }

  const handleSwitchToLogin = () => {
    setCurrentPage('login')
  }

  return (
    <div className="app">
      {currentPage === 'login' ? (
        <Login onSwitchToRegister={handleSwitchToRegister} />
      ) : (
        <Register onSwitchToLogin={handleSwitchToLogin} />
      )}
    </div>
  )
}

export default App
