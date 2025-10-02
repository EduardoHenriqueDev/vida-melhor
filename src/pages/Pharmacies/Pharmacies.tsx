import { useEffect, useState } from 'react'
import { getPharmacies, type Pharmacy } from '../../services/pharmaciesService'
import './Pharmacies.css'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'

interface PharmaciesProps {
  onBack?: () => void
}

const Pharmacies = ({ onBack }: PharmaciesProps) => {
  const [items, setItems] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPharmacies()
        setItems(data)
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar farmácias')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleBack = () => {
    if (onBack) onBack()
    else window.history.back()
  }

  if (loading) return <div className="pharmacies-container">Carregando...</div>
  if (error) return <div className="pharmacies-container error">{error}</div>

  return (
    <div className="pharmacies-container">
      <Navbar displayName={displayName} onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />
      <Sidebar open={open} displayName={displayName} onClose={() => setOpen(false)} onSignOut={handleSignOut} />

      <div className="pharmacies-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Farmácias</h2>
      </div>

      <div className="grid">
        {items.map((ph) => (
          <div key={ph.id} className="card">
            <div className="card-header">
              <h3 className="name">{ph.name}</h3>
              <span className={`status ${ph.active ? 'active' : 'inactive'}`}>{ph.active ? 'Ativa' : 'Inativa'}</span>
            </div>
            {ph.address && <p className="address">{ph.address}</p>}
            {ph.contact && <p className="contact">Contato: {ph.contact}</p>}
            <p className="email">
              Email: {ph.email}
              <span className={`badge ${ph.email_verified ? 'verified' : 'unverified'}`}>
                {ph.email_verified ? 'Verificado' : 'Não verificado'}
              </span>
            </p>
            <div className="meta">
              <small>Criada: {new Date(ph.created_at).toLocaleDateString()}</small>
              <small>Atualizada: {new Date(ph.updated_at).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Pharmacies