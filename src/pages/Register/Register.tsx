import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../../components/Icons'
import { signUpWithProfile } from '../../services/authService'
import './Register.css'

// Máscaras de CPF e Telefone
function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const len = digits.length

  if (len <= 3) return digits
  if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const len = digits.length
  if (len === 0) return ''

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (len <= 2) return `(${ddd}`
  if (len <= 6) return `(${ddd}) ${rest}`
  if (len <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

interface RegisterProps {
  onSwitchToLogin: () => void
}

const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let next = value
    if (name === 'cpf') next = maskCPF(value)
    if (name === 'phone') next = maskPhone(value)

    setFormData(prev => ({
      ...prev,
      [name]: next
    }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!')
      return
    }

    setLoading(true)
    try {
      await signUpWithProfile({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
      })
      // eslint-disable-next-line no-alert
      alert('Cadastro realizado com sucesso! Faça login para continuar.')
      onSwitchToLogin()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <img src="/logo.png" alt="Logo" className="app-logo" />
          <p>Crie sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Digite seu e-mail"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="Digite seu CPF"
              inputMode="numeric"
              maxLength={14}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Digite seu telefone"
              inputMode="tel"
              maxLength={15}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirme sua senha"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Já tem uma conta?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register