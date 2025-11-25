import { IoMdMenu } from "react-icons/io";
import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi'
import NotificationsDrawer, { type NotificationItem } from '../Notifications/NotificationsDrawer'
import './Navbar.css'
import { supabase } from '../../lib/supabaseClient'

interface NavbarProps {
    onSignOut: () => void
    onOpenMenu?: () => void
    onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas') => void
    displayName?: string
}

const Navbar = ({ onOpenMenu, onNavigate }: NavbarProps) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const goHome = () => { try { localStorage.setItem('last_page', 'home') } catch { }; onNavigate?.('home') }

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data: userData } = await supabase.auth.getUser()
                const user = userData.user
                if (!user?.id) { setNotifications([]); return }
                const now = new Date()
                const upper = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // limite de 72h
                const { data, error } = await supabase
                    .from('consultation')
                    .select('id,name,date,type,doctor_name,specialty')
                    .eq('user_id', user.id)
                    .gte('date', now.toISOString())
                    .lte('date', upper.toISOString())
                    .order('date', { ascending: true })
                if (error) throw error
                if (cancelled) return
                const items: NotificationItem[] = (data || [])
                    .filter((c: any) => {
                        const diff = new Date(c.date).getTime() - now.getTime()
                        return diff >= 0 && diff <= 72 * 60 * 60 * 1000 // garantir até 3 dias
                    })
                    .map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        specialty: c.specialty,
                        type: c.type,
                        doctorName: c.doctor_name,
                        dateISO: c.date,
                        read: false, // sempre como alerta até passar a data
                    }))
                setNotifications(items)
            } catch (e) {
                if (!cancelled) setNotifications([])
            }
        }
        load()
        const interval = setInterval(load, 60 * 1000) // atualiza a cada minuto
        return () => { cancelled = true; clearInterval(interval) }
    }, [])

    return (
        <header className="home-header">
            <div className="home-left">
                <img src="/logo.png" alt="Logo" className="nav-logo clickable" onClick={goHome} role="link" aria-label="Ir para a Home" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <button type="button" className="nav-bell-btn" aria-label="Notificações" onClick={() => setNotificationsOpen(o=>!o)}>
                    <FiBell />
                </button>
                <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
                    <IoMdMenu className="icon" />
                </button>
            </div>
            <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} items={notifications} />
        </header>
    )
}

export default Navbar