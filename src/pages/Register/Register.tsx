import { useState } from 'react'
import { CoolInput, PasswordInput } from '../../components/CoolInput/CoolInput'
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
    confirmPassword: '',
    role: 'idoso' // 'idoso' ou 'cuidador'
  })

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

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value
    }))
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
        role: formData.role === 'cuidador',
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
          <CoolInput
            label="Nome completo"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite seu nome completo"
            required
          />

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

          <CoolInput
            label="CPF"
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

          <CoolInput
            label="Telefone"
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

          <PasswordInput
            label="Senha"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Digite sua senha"
            required
          />

          <PasswordInput
            label="Confirmar senha"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirme sua senha"
            required
          />

          {/* Checkbox de tipo de usuário */}
          <div className="register-role-group">
            <label className="register-role-label">
              <input
                type="radio"
                name="role"
                value="idoso"
                checked={formData.role === 'idoso'}
                onChange={handleRoleChange}
                id="idoso"
                className="register-role-radio"
              />
              Idoso/Responsável
            </label>
            <label className="register-role-label">
              <input
                type="radio"
                name="role"
                value="cuidador"
                checked={formData.role === 'cuidador'}
                onChange={handleRoleChange}
                id="cuidador"
                className="register-role-radio"
              />
              Cuidador
            </label>
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