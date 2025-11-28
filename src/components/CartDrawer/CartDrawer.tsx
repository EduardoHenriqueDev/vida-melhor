// filepath: c:\vida-melhor\src\components\CartDrawer\CartDrawer.tsx
import { useMemo, useEffect } from 'react'
import './CartDrawer.css'
import { useCart } from '../../contexts/CartContext'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  highlightId?: string
}

const CartDrawer = ({ open, onClose, highlightId }: CartDrawerProps) => {
  const { items = [], removeItem, clear, count } = (useCart() as any) || {}

  const total = useMemo(() => {
    try { return (items || []).reduce((sum: number, it: any) => sum + (it.price_in_cents || 0) * (it.qty || 1), 0) } catch { return 0 }
  }, [items])

  const formatPrice = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`cart-drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Carrinho">
        <div className="cd-header">
          <h3 className="cd-title">Carrinho {typeof count === 'number' ? `(${count})` : ''}</h3>
          <button className="cd-close" onClick={onClose} aria-label="Fechar carrinho">×</button>
        </div>
        <div className="cd-body">
          {(!items || items.length === 0) ? (
            <div className="cd-empty">Seu carrinho está vazio.</div>
          ) : (
            <ul className="cd-list">
              {(items as any[]).map((it: any, idx: number) => (
                <li key={`${it.id || idx}`} className={`cd-item ${highlightId === it.id ? 'highlight' : ''}`}>
                  <div className="cd-item-main">
                    <div className="cd-item-name" title={it.name}>{it.name}</div>
                    <div className="cd-item-meta">
                      <span className="cd-item-qty">{it.qty ? `x${it.qty}` : 'x1'}</span>
                      <span className="cd-item-price">{formatPrice((it.price_in_cents || 0) * (it.qty || 1))}</span>
                    </div>
                  </div>
                  {removeItem && (
                    <button type="button" className="cd-remove" onClick={() => removeItem(it.id)} aria-label="Remover">Remover</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="cd-footer">
          <div className="cd-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <div className="cd-actions">
            {clear && (
              <button type="button" className="cd-action ghost" onClick={() => clear()}>Limpar</button>
            )}
            <button type="button" className="cd-action primary" onClick={onClose}>Continuar</button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default CartDrawer
