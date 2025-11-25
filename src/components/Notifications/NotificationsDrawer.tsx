import { useEffect } from 'react'
import './NotificationsDrawer.css'

export interface NotificationItem {
  id: string
  name?: string
  specialty?: string
  type?: string
  doctorName?: string
  dateISO?: string
  read?: boolean
}

interface NotificationsDrawerProps {
  open: boolean
  onClose: () => void
  items?: NotificationItem[]
}

const NotificationsDrawer = ({ open, onClose, items = [] }: NotificationsDrawerProps) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  return (
    <div className={`notif-drawer-wrapper ${open ? 'open': ''}`} aria-hidden={!open}>
      <div className="notif-backdrop" onClick={onClose} />
      <aside className="notif-drawer" role="dialog" aria-label="Notificações" aria-modal="true">
        <div className="sidebar-header notif-sidebar-header">
          <h3 className="notif-title">Notificações</h3>
          <button type="button" className="sidebar-close" aria-label="Fechar" onClick={onClose}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="notif-body">
          {items.length === 0 && (
            <div className="notif-empty">Nenhuma notificação.</div>
          )}
          {items.map(n => {
            const dateObj = n.dateISO ? new Date(n.dateISO) : null
            const diffMs = dateObj ? (dateObj.getTime() - Date.now()) : 0
            const hours = diffMs / 3600000
            let urgencyClass = ''
            // Urgência: <=6h alta, <=24h média, <=72h baixa
            if (hours <= 6) urgencyClass = 'alert-high'
            else if (hours <= 24) urgencyClass = 'alert-med'
            else urgencyClass = 'alert-low'
            const remainingText = hours >= 24
              ? `${Math.max(1, Math.floor(hours / 24))} dia(s)`
              : `${Math.max(1, Math.ceil(hours))} hora(s)`
            const ariaText = `${n.specialty || n.name || 'Consulta'} em ${dateObj?.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}. Faltam ${remainingText}.`
            return (
              <div key={n.id} className={`notif-item ${n.read ? 'read': ''} ${urgencyClass}`} role="alert" aria-label={ariaText}>
                <div className="notif-mini-header">
                  <span className="notif-item-title" title={n.specialty || n.name}>{n.specialty || n.name}</span>
                  {n.type && <span className="notif-item-type" title={n.type}>{n.type}</span>}
                </div>
                <span className="notif-item-remaining">Consulta será daqui {remainingText}</span>
                {n.doctorName && <span className="notif-item-doc" title={`Médico: ${n.doctorName}`}>Dr(a). {n.doctorName}</span>}
                {dateObj && (
                  <span className="notif-item-date" title={n.dateISO}>{dateObj.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}

export default NotificationsDrawer
