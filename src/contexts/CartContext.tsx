import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type CartItem = {
  id: string
  name: string
  price_in_cents: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  count: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = 'cart_v1'

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem: CartContextType['addItem'] = ({ id, name, price_in_cents, quantity = 1 }) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, { id, name, price_in_cents, quantity }]
    })
  }

  const count = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, count, addItem }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
