import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import { getstore, type Medication } from '../../services/storeService'
import './Store.css'
import Loading from '../../components/Loading/Loading'
import CartIcon from '../../components/CartIcon/CartIcon'
import { useCart } from '../../contexts/CartContext'
import { FaCartPlus } from 'react-icons/fa'
import FancyCard from '../../components/FancyCard/FancyCard'

interface storeProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications' | 'consultas' | 'store') => void
}

const store = ({ onNavigate }: storeProps) => {
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
        const data = await getstore()
        setItems(data)
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => { /* removido tracking prev/last_page para usar histórico central */ }, [])

  const handleSignOut = async () => { await signOut() }
  const handleBack = () => { onNavigate?.('home') }
  const formatPrice = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (loading) return (
    <div className="store-container">
      <Loading fullPage />
    </div>
  )
  if (error) return <div className="store-container error">{error}</div>

  return (
    <div className="store-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />
      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={onNavigate}
        activePage="store"
      />

      <div className="store-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Loja</h2>
        <div className="cart-wrap">
          <CartIcon count={count} />
        </div>
      </div>

      <div className="grid">
        {items.map((m) => (
          <FancyCard key={m.id} title={m.name} width="100%" height="auto">
            <div className="card-body">
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <span className={`badge ${m.is_generic ? 'generic' : 'brand'}`}>{m.is_generic ? 'Genérico' : 'Marca'}</span>
              </div>
              {m.description && <p className="desc" title={m.description}>{m.description}</p>}
              <div className="inline-meta">
                {m.stock > 0 ? (
                  <span className="stock">Estoque: {m.stock}</span>
                ) : (
                  <span className="out-of-stock" aria-label="Fora de estoque">Fora de estoque</span>
                )}
                <span className="price">{formatPrice(m.price_in_cents)}</span>
              </div>
              <div className="card-footer">
                <small className="slug">Slug: {m.slug}</small>
                <button
                  type="button"
                  className={`add-btn ${m.stock === 0 ? 'disabled' : ''}`}
                  aria-label={m.stock === 0 ? `${m.name} fora de estoque` : `Adicionar ${m.name} ao carrinho`}
                  disabled={m.stock === 0}
                  onClick={() => m.stock > 0 && addItem({ id: m.id, name: m.name, price_in_cents: m.price_in_cents })}
                >
                  <FaCartPlus />
                </button>
              </div>
            </div>
          </FancyCard>
        ))}
      </div>
    </div>
  )
}

export default store
