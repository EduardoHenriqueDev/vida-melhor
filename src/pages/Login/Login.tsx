import { useState } from 'react'
import { CoolInput, PasswordInput } from '../../components/CoolInput/CoolInput'
import { signIn, ensureUserProfile } from '../../services/authService'
import './Login.css'

interface LoginProps {
  onSwitchToRegister: () => void
  onLoginSuccess?: () => void
}

const Login = ({ onSwitchToRegister, onLoginSuccess }: LoginProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(formData.email, formData.password)
      await ensureUserProfile()
      onLoginSuccess?.()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Logo" className="app-logo" />
          <p>Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <CoolInput
            label="E-mail"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Digite seu e-mail"
            required
          />

          <PasswordInput
            label="Senha"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Digite sua senha"
            required
          />

          {error && <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Ainda não tem uma conta?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login