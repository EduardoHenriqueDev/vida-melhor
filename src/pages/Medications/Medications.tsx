import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import { getMedications, type Medication } from '../../services/medicationsService'
import './Medications.css'
import Loading from '../../components/Loading/Loading'
import CartIcon from '../../components/CartIcon/CartIcon'
import { useCart } from '../../contexts/CartContext'

interface MedicationsProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'profile' | 'pharmacies' | 'medications') => void
}

const Medications = ({ onBack, onNavigate }: MedicationsProps) => {
  const [items, setItems] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [open, setOpen] = useState(false)
  const { addItem, count } = useCart()

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
        const data = await getMedications()
        setItems(data)
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSignOut = async () => { await signOut() }
  const handleBack = () => { if (onBack) onBack(); else window.history.back() }
  const formatPrice = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (loading) return (
    <div className="medications-container">
      <Loading fullPage />
    </div>
  )
  if (error) return <div className="medications-container error">{error}</div>

  return (
    <div className="medications-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />
      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={onNavigate}
        activePage="medications"
      />

      <div className="medications-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Medicamentos</h2>
        <div style={{ marginLeft: 'auto' }}>
          <CartIcon count={count} />
        </div>
      </div>

      <div className="grid">
        {items.map((m) => (
          <div key={m.id} className="card">
            <div className="card-header">
              <h3 className="name">{m.name}</h3>
              <span className={`badge ${m.is_generic ? 'generic' : 'brand'}`}>
                {m.is_generic ? 'Genérico' : 'Marca'}
              </span>
            </div>
            {m.description && <p className="desc">{m.description}</p>}
            <p className="stock">Estoque: {m.stock}</p>
            <p className="price">{formatPrice(m.price_in_cents)}</p>
            <div className="meta">
              <small>Slug: {m.slug}</small>
              <small>Criado: {new Date(m.created_at).toLocaleDateString()}</small>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => addItem({ id: m.id, name: m.name, price_in_cents: m.price_in_cents })}
                style={{
                  background: 'var(--primary-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer'
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Medications
