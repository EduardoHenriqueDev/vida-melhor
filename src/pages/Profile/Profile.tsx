import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { signOut } from '../../services/authService'

interface ProfileProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'pharmacies') => void
}

const Profile = ({ onSignOut, onNavigate }: ProfileProps) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState<string>('Usuário')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [cpf, setCpf] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const meta = (user?.user_metadata as any) || {}

      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, email, phone, cpf')
          .eq('id', user.id)
          .maybeSingle()

        setName(profile?.name || meta?.name || user?.email || 'Usuário')
        setEmail(profile?.email || user?.email || '')
        setPhone(profile?.phone || meta?.phone || '')
        setCpf(profile?.cpf || meta?.cpf || '')
      } else {
        setName(meta?.name || user?.email || 'Usuário')
        setEmail(user?.email || '')
        setPhone(meta?.phone || '')
        setCpf(meta?.cpf || '')
      }
    }
    load()
  }, [])

  useEffect(() => {
    const ensureSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) onSignOut()
      } catch (e) {
        console.error('Erro verificando sessão (Profile):', e)
        onSignOut()
      }
    }
    ensureSession()
  }, [onSignOut])

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  // helpers de exibição
  const formatCPF = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
  }
  const formatPhone = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11)
    if (!d) return ''
    const ddd = d.slice(0,2); const r = d.slice(2)
    if (d.length <= 6) return `(${ddd}) ${r}`
    if (d.length <= 10) return `(${ddd}) ${r.slice(0,4)}-${r.slice(4)}`
    return `(${ddd}) ${r.slice(0,5)}-${r.slice(5)}`
  }

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />

      {/* Card centralizado com informações */}
      <div className="home-toolbar" style={{ padding: '1rem 0' }}>
        <div style={{ width: 'calc(100% - 2rem)', margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '1.25rem',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '9999px',
                background: '#e5e7eb', color: '#6b7280',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true">
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
                </svg>
              </div>
            </div>

            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }}>{name}</div>
            <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{email}</div>

            <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'center' }}>
              <div style={{ color: '#111827' }}><strong>Telefone: </strong>{formatPhone(phone)}</div>
              <div style={{ color: '#111827' }}><strong>CPF: </strong>{formatCPF(cpf)}</div>
            </div>
          </div>
        </div>
      </div>

      <Sidebar
        open={open}
        displayName={name}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={onNavigate}
        activePage="profile" // + highlight Profile
      />
    </div>
  )
}

export default Profile
