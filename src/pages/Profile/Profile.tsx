import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { signOut } from '../../services/authService'
import { FaPen } from 'react-icons/fa'
import './Profile.css'

interface ProfileProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'pharmacies' | 'store' | 'cuidador' | 'consultas' | 'medications') => void
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
  const [address, setAddress] = useState<string>('')
  const [formAddress, setFormAddress] = useState('')
  const [specialCare, setSpecialCare] = useState<string>('')
  const [formSpecialCare, setFormSpecialCare] = useState('')
  const [saving, setSaving] = useState(false)
  // remove saveError unused warning but keep state for UI errors
  const [saveError, setSaveError] = useState<string|null>(null)
  const [addrSuggestions, setAddrSuggestions] = useState<string[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [showAddrSug, setShowAddrSug] = useState(false)
  const [addrError, setAddrError] = useState<string|null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const meta = (user?.user_metadata as any) || {}

      if (user?.id) {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('name, email, phone, cpf, adress, special_care')
          .eq('id', user.id)
          .maybeSingle()

        let prof = profile as any
        if (profErr && ((profErr as any).code === '42703' || /column .*adress/i.test(profErr.message))) {
          const { data: prof2 } = await supabase
            .from('profiles')
            .select('name, email, phone, cpf, address, special_care')
            .eq('id', user.id)
            .maybeSingle()
          if (prof2) prof = { ...prof2, adress: (prof2 as any).address }
        }

        setName(prof?.name || meta?.name || user?.email || 'Usuário')
        setEmail(prof?.email || user?.email || '')
        setPhone(prof?.phone || meta?.phone || '')
        setCpf(prof?.cpf || meta?.cpf || '')
        setAddress(prof?.adress || meta?.address || '')
        setSpecialCare(prof?.special_care || meta?.special_care || '')
        setFormName(prof?.name || meta?.name || user?.email || 'Usuário')
        setFormEmail(prof?.email || user?.email || '')
        setFormPhone((prof?.phone || meta?.phone || '').replace(/\D/g,'').slice(0,11))
        setFormCpf((prof?.cpf || meta?.cpf || '').replace(/\D/g,'').slice(0,11))
        setFormAddress((prof?.adress || meta?.address || ''))
        setFormSpecialCare((prof?.special_care || meta?.special_care || ''))
      } else {
        setName(meta?.name || user?.email || 'Usuário')
        setEmail(user?.email || '')
        setPhone((meta?.phone || '').replace(/\D/g,'').slice(0,11))
        setCpf((meta?.cpf || '').replace(/\D/g,'').slice(0,11))
        setAddress(meta?.address || '')
        setFormAddress(meta?.address || '')
        setSpecialCare(meta?.special_care || '')
        setFormSpecialCare(meta?.special_care || '')
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

  useEffect(() => { try { localStorage.setItem('last_page','profile') } catch {} }, [])

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

  const openEdit = () => {
    setFormName(name)
    setFormEmail(email)
    setFormPhone(phone)
    setFormCpf(cpf)
    setFormAddress(address)
    setFormSpecialCare(specialCare)
    setEditOpen(true)
  }
  const cancelEdit = () => {
    setFormName(name)
    setFormEmail(email)
    setFormPhone((phone || '').replace(/\D/g,'').slice(0,11))
    setFormCpf((cpf || '').replace(/\D/g,'').slice(0,11))
    setFormAddress(address || '')
    setFormSpecialCare(specialCare || '')
    setEditOpen(false)
  }

  const handleSave = useCallback(async () => {
    setSaving(true); setSaveError(null)
    try {
      const cleanCpf = formCpf.replace(/\D/g,'').slice(0,11)
      const cleanPhone = formPhone.replace(/\D/g,'').slice(0,11)
      const cleanAddress = (formAddress || '').trim()
      const cleanSpecial = (formSpecialCare || '').trim()
      const { data: userResp } = await supabase.auth.getUser()
      const user = userResp.user
      if(!user) throw new Error('Sessão expirada')

      if (formEmail.trim() && formEmail.trim() !== email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: formEmail.trim() })
        if (emailErr) throw new Error(emailErr.message || 'Falha ao atualizar email de autenticação')
      }

      // UPDATE com select; se nenhuma linha, faz INSERT. Fallback de 'adress' -> 'address'.
      let updated: any = null
      let updErr: any = null
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, adress: cleanAddress, special_care: cleanSpecial })
          .eq('id', user.id)
          .select('id, name, email, phone, cpf, adress, special_care')
          .maybeSingle()
        updated = data
        updErr = error
      } catch (e:any) {
        updErr = e
      }
      if (updErr && ((updErr as any).code === '42703' || /adress/i.test(updErr.message))) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, address: cleanAddress, special_care: cleanSpecial })
          .eq('id', user.id)
          .select('id, name, email, phone, cpf, address, special_care')
          .maybeSingle()
        updated = data ? { ...data, adress: (data as any).address } : null
        updErr = error
      }
      if (updErr && (updErr.code === '42501' || /permission|denied|403/i.test(updErr.message))) {
        throw new Error('Sem permissão para atualizar (verifique policies RLS de update).')
      }
      // Se não atualizou nada (registro não existe), tenta INSERT
      if (!updated) {
        let insErr: any = null
        try {
          const { error } = await supabase
            .from('profiles')
            .insert({ id: user.id, name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, email: formEmail.trim(), adress: cleanAddress, special_care: cleanSpecial })
          insErr = error
        } catch (e:any) { insErr = e }
        if (insErr && ((insErr as any).code === '42703' || /adress/i.test(insErr.message))) {
          const { error } = await supabase
            .from('profiles')
            .insert({ id: user.id, name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, email: formEmail.trim(), address: cleanAddress, special_care: cleanSpecial })
          if (error) throw error
        } else if (insErr) {
          throw insErr
        }
        // Refetch após insert
        const { data: profIns, error: profInsErr } = await supabase
          .from('profiles')
          .select('name, email, phone, cpf, adress, special_care')
          .eq('id', user.id)
          .maybeSingle()
        let profFinal = profIns as any
        if (profInsErr && ((profInsErr as any).code === '42703' || /adress/i.test(profInsErr.message))) {
          const { data: profIns2 } = await supabase
            .from('profiles')
            .select('name, email, phone, cpf, address, special_care')
            .eq('id', user.id)
            .maybeSingle()
          profFinal = profIns2 ? { ...profIns2, adress: (profIns2 as any).address } : null
        }
        if (profFinal) {
          setName(profFinal.name || formName.trim())
          setEmail(profFinal.email || formEmail.trim())
          setPhone((profFinal.phone || cleanPhone))
          setCpf((profFinal.cpf || cleanCpf))
          setAddress((profFinal.adress || cleanAddress))
          setSpecialCare((profFinal.special_care || cleanSpecial))
        }
      }
      // Atualiza metadados para outros componentes enxergarem
      await supabase.auth.updateUser({ data: { name: formName.trim(), phone: cleanPhone, cpf: cleanCpf, address: cleanAddress, special_care: cleanSpecial } })
      // Dispara evento global
      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: formName.trim() } })) } catch {}
      setName(formName.trim());
      setEmail(formEmail.trim());
      setPhone(cleanPhone);
      setCpf(cleanCpf);
      setAddress(cleanAddress);
      setSpecialCare(cleanSpecial);
      setEditOpen(false)
      try { localStorage.setItem('last_page','profile') } catch {}
    } catch(e:any) {
      setSaveError(e.message || 'Erro ao salvar')
    } finally { setSaving(false) }
  }, [formName, formEmail, formPhone, formCpf, email, formAddress, formSpecialCare])

  const handlePhoneChange = (v: string) => { const digits = v.replace(/\D/g,'').slice(0,11); setFormPhone(digits) }
  const handleCpfChange = (v: string) => { const digits = v.replace(/\D/g,'').slice(0,11); setFormCpf(digits) }

  useEffect(() => {
    if (!editOpen) return
    const q = (formAddress || '').trim()
    setAddrError(null)
    const gkey = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined
    const mtoken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
    const provider = gkey ? 'geoapify' : (mtoken ? 'mapbox' : 'nominatim')
    if (q.length < 3) { setAddrSuggestions([]); setAddrLoading(false); return }
    let cancelled = false
    setAddrLoading(true)
    const t = setTimeout(async () => {
      try {
        let url = ''
        if (provider === 'geoapify') {
          url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&limit=5&filter=countrycode:br&lang=pt&apiKey=${gkey}`
        } else if (provider === 'mapbox') {
          url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?autocomplete=true&limit=5&language=pt-BR&country=BR&access_token=${mtoken}`
        } else {
          url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&accept-language=pt-BR&countrycodes=br`
        }
        const resp = await fetch(url, provider==='nominatim' ? { headers: { 'Accept': 'application/json' } } : undefined)
        if (!resp.ok) throw new Error(`Erro ${resp.status}`)
        const data = await resp.json()
        if (cancelled) return
        let items: string[] = []
        if (provider === 'geoapify') {
          items = (data?.features || []).map((f: any) => f?.properties?.formatted).filter(Boolean)
        } else if (provider === 'mapbox') {
          items = (data?.features || []).map((f: any) => f?.place_name).filter(Boolean)
        } else {
          items = (data || []).map((f: any) => f?.display_name).filter(Boolean)
        }
        setAddrSuggestions(items)
      } catch (e: any) {
        if (!cancelled) { setAddrSuggestions([]); setAddrError(e?.message || 'Falha ao buscar sugestões') }
      } finally {
        if (!cancelled) setAddrLoading(false)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [formAddress, editOpen])

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />

      <section className="profile-hero">
        <div className="profile-hero-inner">
          <h1 className="profile-hero-title">Meu Perfil</h1>
          <p className="profile-hero-sub">Gerencie suas informações</p>
        </div>
      </section>

      <section className="profile-card-wrap">
        <div className="profile-card">
          <button type="button" aria-label="Editar perfil" className="profile-edit" onClick={openEdit} disabled={editOpen}>
            <FaPen size={14} />
          </button>

          <div className="profile-card-header">
            <div className="avatar-lg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
              </svg>
            </div>
            <div className="profile-ident">
              {editOpen ? (
                <>
                  <input className="profile-input name" value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Nome" />
                  <input className="profile-input email" type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} placeholder="Email" />
                </>
              ) : (
                <>
                  <div className="profile-name">{name}</div>
                  <div className="profile-email">{email}</div>
                </>
              )}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Telefone</span>
              {editOpen ? (
                <input className="profile-input" value={formatPhone(formPhone)} onChange={e=>handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" />
              ) : (
                <span className="info-value">{formatPhone(phone) || '—'}</span>
              )}
            </div>
            <div className="info-item">
              <span className="info-label">CPF</span>
              {editOpen ? (
                <input className="profile-input" value={formatCPF(formCpf)} onChange={e=>handleCpfChange(e.target.value)} placeholder="000.000.000-00" />
              ) : (
                <span className="info-value">{formatCPF(cpf) || '—'}</span>
              )}
            </div>
            <div className="info-item">
              <span className="info-label">Endereço</span>
              {editOpen ? (
                <div className="address-field">
                  <input
                    className="profile-input"
                    value={formAddress}
                    onChange={e=>setFormAddress(e.target.value)}
                    onFocus={()=>setShowAddrSug(true)}
                    onBlur={()=> setTimeout(()=> setShowAddrSug(false), 150)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                  {showAddrSug && (
                    <div className="address-dropdown" role="listbox">
                      {!import.meta.env.VITE_GEOAPIFY_KEY && !import.meta.env.VITE_MAPBOX_TOKEN && (
                        <div className="address-error">Configure VITE_GEOAPIFY_KEY (gratuito) ou VITE_MAPBOX_TOKEN para habilitar sugestões.</div>
                      )}
                      {addrError && <div className="address-error">{addrError}</div>}
                      {addrLoading && <div className="address-empty">Procurando...</div>}
                      {!addrLoading && formAddress.trim().length<3 && (
                        <div className="address-empty">Digite pelo menos 3 caracteres</div>
                      )}
                      {!addrLoading && formAddress.trim().length>=3 && addrSuggestions.length===0 && !addrError && (
                        <div className="address-empty">Nenhuma sugestão</div>
                      )}
                      {!addrLoading && addrSuggestions.map(s => (
                        <button
                          type="button"
                          key={s}
                          className="address-opt"
                          role="option"
                          onMouseDown={e=> e.preventDefault()}
                          onClick={()=>{ setFormAddress(s); setShowAddrSug(false) }}
                          title={s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="info-value">{address || '—'}</span>
              )}
            </div>
            <div className="info-item">
              <span className="info-label">Cuidados especiais</span>
              {editOpen ? (
                <input className="profile-input" value={formSpecialCare} onChange={e=>setFormSpecialCare(e.target.value)} placeholder="Ex.: alergias, restrições" />
              ) : (
                <span className="info-value">{specialCare || '—'}</span>
              )}
            </div>
          </div>

          {editOpen && (
            <div className="profile-actions">
              <button type="button" className="profile-action secondary" onClick={cancelEdit}>Cancelar</button>
              <button type="button" className="profile-action primary" onClick={handleSave} disabled={saving || !formName.trim() || !formEmail.trim()}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
          {saveError && (
            <div className="profile-error" role="alert" aria-live="assertive">{saveError}</div>
          )}
        </div>
      </section>

      <Sidebar open={open} displayName={name} onClose={() => setOpen(false)} onSignOut={handleSignOut} onNavigate={onNavigate} activePage="profile" />
    </div>
  )
}

export default Profile
