import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { signOut } from '../../services/authService'
import { FaPen } from 'react-icons/fa'
import Modal, { ModalFooter, ModalAction } from '../../components/Modal/Modal'

interface ProfileProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'pharmacies' | 'medications' | 'cuidador') => void
}

const Profile = ({ onSignOut, onNavigate }: ProfileProps) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState<string>('Usuário')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [cpf, setCpf] = useState<string>('')
  const [editOpen, setEditOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formCpf, setFormCpf] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string|null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const meta = (user?.user_metadata as any) || {}

      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, phone, cpf')
          .eq('id', user.id)
          .maybeSingle()

        setName(profile?.name || meta?.name || user?.email || 'Usuário')
        setEmail(profile?.email || user?.email || '')
        setPhone(profile?.phone || meta?.phone || '')
        setCpf(profile?.cpf || meta?.cpf || '')
        setFormName(profile?.name || meta?.name || user?.email || 'Usuário')
        setFormEmail(profile?.email || user?.email || '')
        setFormPhone((profile?.phone || meta?.phone || '').replace(/\D/g,'').slice(0,11))
        setFormCpf((profile?.cpf || meta?.cpf || '').replace(/\D/g,'').slice(0,11))
      } else {
        setName(meta?.name || user?.email || 'Usuário')
        setEmail(user?.email || '')
        setPhone((meta?.phone || '').replace(/\D/g,'').slice(0,11))
        setCpf((meta?.cpf || '').replace(/\D/g,'').slice(0,11))
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

  const openEdit = () => { setFormName(name); setFormEmail(email); setFormPhone(phone); setFormCpf(cpf); setEditOpen(true) }
  const handleSave = useCallback(async () => {
    setSaving(true); setSaveError(null)
    try {
      const cleanCpf = formCpf.replace(/\D/g,'').slice(0,11)
      const cleanPhone = formPhone.replace(/\D/g,'').slice(0,11)
      const { data: userResp } = await supabase.auth.getUser()
      const user = userResp.user
      if(!user) throw new Error('Sessão expirada')

      if (formEmail.trim() && formEmail.trim() !== email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: formEmail.trim() })
        if (emailErr) throw new Error(emailErr.message || 'Falha ao atualizar email de autenticação')
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ name: formName.trim(), phone: cleanPhone, cpf: cleanCpf })
        .eq('id', user.id)
      if (updateErr) {
        if ((updateErr as any).code === '42501' || /permission|denied|403/i.test(updateErr.message)) {
          throw new Error('Sem permissão para atualizar (verifique políticas RLS da tabela profiles).')
        }
        // Se registro não existir tentar inserir
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, email: formEmail.trim() })
        if (insertErr) throw insertErr
      }

      setName(formName.trim());
      setEmail(formEmail.trim());
      setPhone(cleanPhone);
      setCpf(cleanCpf);
      setEditOpen(false)
    } catch(e:any) {
      setSaveError(e.message || 'Erro ao salvar')
    } finally { setSaving(false) }
  }, [formName, formEmail, formPhone, formCpf, email])

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g,'').slice(0,11)
    setFormPhone(digits)
  }
  const handleCpfChange = (v: string) => {
    const digits = v.replace(/\D/g,'').slice(0,11)
    setFormCpf(digits)
  }

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} />
      <div className="home-toolbar" style={{ padding: '1rem 0' }}>
        <div style={{ width: 'calc(100% - 2rem)', margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '1.25rem',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              aria-label="Editar perfil"
              onClick={openEdit}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'linear-gradient(135deg,var(--primary-color),var(--secondary-color))',
                border: 'none', color: '#fff', cursor: 'pointer',
                width: 36, height: 36, borderRadius: '10px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'background .15s, transform .1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(.94)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FaPen size={16} />
            </button>
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
        activePage="profile" 
      />
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Editar perfil">
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, fontWeight:600, color:'var(--primary-color)' }}>Nome
            <input value={formName} onChange={e=>setFormName(e.target.value)} style={{ padding:'0.6rem 0.7rem', border:'2px solid var(--primary-color)', borderRadius:8, fontSize:13 }} />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, fontWeight:600, color:'var(--primary-color)' }}>Email
            <input type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} style={{ padding:'0.6rem 0.7rem', border:'2px solid var(--primary-color)', borderRadius:8, fontSize:13 }} />
          </label>
          <div style={{ display:'grid', gap:'.75rem', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))' }}>
            <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, fontWeight:600, color:'var(--primary-color)' }}>Telefone
              <input value={formatPhone(formPhone)} onChange={e=>handlePhoneChange(e.target.value)} style={{ padding:'0.6rem 0.7rem', border:'2px solid var(--primary-color)', borderRadius:8, fontSize:13 }} />
            </label>
            <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, fontWeight:600, color:'var(--primary-color)' }}>CPF
              <input value={formatCPF(formCpf)} onChange={e=>handleCpfChange(e.target.value)} style={{ padding:'0.6rem 0.7rem', border:'2px solid var(--primary-color)', borderRadius:8, fontSize:13 }} />
            </label>
          </div>
          {saveError && <div style={{ fontSize:12, fontWeight:600, color:'#b91c1c' }}>{saveError}</div>}
        </div>
        <ModalFooter>
          <ModalAction $variant="secondary" type="button" onClick={()=>setEditOpen(false)}>Cancelar</ModalAction>
          <ModalAction type="button" disabled={saving || !formName.trim() || !formEmail.trim()} onClick={handleSave}>{saving? 'Salvando...' : 'Salvar'}</ModalAction>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Profile
