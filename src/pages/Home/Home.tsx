import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import './Home.css'
import SearchBar from '../../components/SearchBar/SearchBar'
import { FaClinicMedical, FaCalendarAlt, FaPills, FaUser, FaPlus } from 'react-icons/fa'
import CartIcon from '../../components/CartIcon/CartIcon'
import { MdEmergency } from 'react-icons/md'
import { useCart } from '../../contexts/CartContext'
import Modal, { ModalFooter, ModalAction } from '../../components/Modal/Modal'

type HomeMedicineRow = {
  id: number
  nome: string
  dose: string
  estoque: number
  ultima_dose: string | null
  frequencia_horas?: number | null
  user_id?: string
}

interface HomeProps {
  onSignOut: () => void
  onNavigate: (
    page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas' | 'medications'
  ) => void
}

interface ConsultationRow {
  id: string
  name: string
  date: string
  type: string
  doctor_name: string
  specialty: string
}

const Home = ({ onSignOut, onNavigate }: HomeProps) => {
  const [displayName, setDisplayName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [isCarer, setisCarer] = useState(false)
  const { count } = useCart()
  const [userId, setUserId] = useState<string>('')
  const [meds, setMeds] = useState<HomeMedicineRow[]>([])
  const [medsLoading, setMedsLoading] = useState(true)
  const [medsError, setMedsError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
  const [consultations, setConsultations] = useState<ConsultationRow[]>([])
  const [consultLoading, setConsultLoading] = useState(true)
  const [consultError, setConsultError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [medsFound, setMedsFound] = useState<any[]>([])
  const [pharmsFound, setPharmsFound] = useState<any[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pendingMed, setPendingMed] = useState<HomeMedicineRow | null>(null)
  const [doseModalOpen, setDoseModalOpen] = useState(false)
  const [doseSaving, setDoseSaving] = useState(false)
  const [elderNames, setElderNames] = useState<Record<string, string>>({})
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const emergencyPhone = '193'

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      let profileName: string | undefined
      if (user?.id) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .maybeSingle()
        if (!error) {
          profileName = (prof as any)?.name
          setisCarer(!!(prof as any)?.role)
        }
      }
      const metaName = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(profileName || metaName || user?.email || 'Usuário')
      if (!profileName) setisCarer(!!(user?.user_metadata as any)?.role)
      setUserId(user?.id || '')
    }
    loadUser()
  }, [])

  useEffect(() => {
    const ensureSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) onSignOut()
      } catch (e) {
        console.error('Erro verificando sessão (Home):', e)
        onSignOut()
      }
    }
    ensureSession()
  }, [onSignOut])

  // Carrega medicamentos (idoso: próprios | cuidador: dos idosos vinculados)
  useEffect(() => {
    if (!userId) return
    const loadMeds = async () => {
      setMedsLoading(true)
      setMedsError(null)
      try {
        if (isCarer) {
          const { data: elders, error: eldersErr } = await supabase
            .from('profiles')
            .select('id,name')
            .eq('carer_id', userId)
          if (eldersErr) throw eldersErr
          const ids = (elders || []).map(e => (e as any).id)
          setElderNames(Object.fromEntries(((elders || []) as any[]).map(e => [e.id, e.name || ''])))

          if (ids.length === 0) { setMeds([]); return }

          const { data, error } = await supabase
            .from('medicines')
            .select('id,user_id,nome,dose,estoque,ultima_dose,frequencia_horas')
            .in('user_id', ids)
            .order('id', { ascending: false })
          if (error) throw error
          setMeds((data as HomeMedicineRow[]) || [])
        } else {
          const { data, error } = await supabase
            .from('medicines')
            .select('id,user_id,nome,dose,estoque,ultima_dose,frequencia_horas')
            .eq('user_id', userId)
            .order('id', { ascending: false })
          if (error) throw error
          setMeds((data as HomeMedicineRow[]) || [])
        }
      } catch (e: any) {
        setMedsError(e?.message ?? 'Erro ao carregar medicamentos')
      } finally {
        setMedsLoading(false)
      }
    }
    loadMeds()
  }, [userId, isCarer])

  useEffect(() => {
    if (!userId) return
    const loadConsults = async () => {
      setConsultLoading(true); setConsultError(null)
      try {
        let rows: ConsultationRow[] = []

        if (isCarer) {
          // Cuidador: carregar consultas dos idosos vinculados
          const { data: elders, error: eldersErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('carer_id', userId)
          if (eldersErr) throw eldersErr
          const ids = (elders || []).map(e => (e as any).id)

          if (ids.length > 0) {
            const { data: consults, error: consultErr } = await supabase
              .from('consultation')
              .select('id,name,date,type,doctor_name,specialty')
              .in('user_id', ids)
              .order('date', { ascending: false })
            if (consultErr) throw consultErr
            rows = (consults as ConsultationRow[]) || []
          }
        } else {
          // Idoso: carregar consultas próprias
          const { data, error } = await supabase
            .from('consultation')
            .select('id,name,date,type,doctor_name,specialty')
            .eq('user_id', userId)
            .order('date', { ascending: false })
          if (error) throw error
          rows = (data as ConsultationRow[]) || []
        }

        setConsultations(rows)
      } catch (e: any) {
        setConsultError(e?.message || 'Erro ao carregar consultas')
      } finally { setConsultLoading(false) }
    }
    loadConsults()
  }, [userId, isCarer])

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setMedsFound([])
      setPharmsFound([])
      setSearchError(null)
      return
    }
    let active = true
    setSearching(true)
    setSearchError(null)
    const handler = setTimeout(async () => {
      try {
        const term = `%${searchTerm.trim()}%`
        const [medsResp, pharmsResp] = await Promise.all([
          supabase.from('medications').select('id,name,slug,description,is_generic,stock,price_in_cents,category_id,pharmacy_id,created_at').ilike('name', term).limit(8),
          supabase.from('pharmacies').select('id,name,email,address,contact,active').ilike('name', term).limit(8)
        ])
        if (!active) return
        if (medsResp.error) throw medsResp.error
        if (pharmsResp.error) throw pharmsResp.error
        setMedsFound((medsResp.data as any[]) || [])
        setPharmsFound(pharmsResp.data || [])
      } catch (e: any) {
        if (active) setSearchError(e?.message || 'Erro na busca')
      } finally {
        if (active) setSearching(false)
      }
    }, 300)
    return () => { active = false; clearTimeout(handler) }
  }, [searchTerm])

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  useEffect(() => {
    const listener = (e: any) => { if(e?.detail?.name) setDisplayName(e.detail.name) }
    window.addEventListener('profile-updated', listener)
    return () => window.removeEventListener('profile-updated', listener)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('last_page','home') } catch {}
  }, [])

  useEffect(() => {
    // Abre modal para o primeiro medicamento com ultima_dose nula
    const m = meds.find(mm => mm.ultima_dose == null)
    if (m) { setPendingMed(m); setDoseModalOpen(true) } else { setPendingMed(null); setDoseModalOpen(false) }
  }, [meds])

  const confirmDoseTaken = async () => {
    if (!pendingMed) return
    try {
      setDoseSaving(true)
      const nowISO = new Date().toISOString()
      const newStock = Math.max(0, (pendingMed.estoque ?? 0) - 1)
      const { error } = await supabase
        .from('medicines')
        .update({ ultima_dose: nowISO, estoque: newStock })
        .eq('id', pendingMed.id)
      if (error) throw error
      // recarrega medicamentos
      try {
        const { data } = await supabase
          .from('medicines')
          .select('id,nome,dose,estoque,ultima_dose,frequencia_horas')
          .eq('user_id', userId)
          .order('id', { ascending: false })
        setMeds((data as HomeMedicineRow[]) || [])
      } catch {}
      setDoseModalOpen(false)
      // agenda limpeza de ultima_dose após frequencia_horas
      const freqH = pendingMed.frequencia_horas || 0
      if (freqH && freqH > 0) {
        setTimeout(async () => {
          try {
            const { error: clearErr } = await supabase
              .from('medicines')
              .update({ ultima_dose: null })
              .eq('id', pendingMed.id)
            if (!clearErr) {
              try {
                const { data } = await supabase
                  .from('medicines')
                  .select('id,nome,dose,estoque,ultima_dose,frequencia_horas')
                  .eq('user_id', userId)
                  .order('id', { ascending: false })
                setMeds((data as HomeMedicineRow[]) || [])
              } catch {}
            }
          } catch {}
        }, freqH * 3600 * 1000)
      }
    } catch (e) {
      console.error('Erro ao confirmar dose:', e)
    } finally {
      setDoseSaving(false)
    }
  }

  // Play a longer and louder notification sound when the dose modal opens
  useEffect(() => {
    if (doseModalOpen && pendingMed) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx()

        // Dynamics compressor to boost perceived loudness
        const comp = ctx.createDynamicsCompressor()
        comp.threshold.value = -24  // start compressing earlier
        comp.knee.value = 30
        comp.ratio.value = 12
        comp.attack.value = 0.003
        comp.release.value = 0.25

        // Master gain (higher base and overall envelope)
        const master = ctx.createGain()
        master.gain.value = 0.003 // was: 0.0008

        // chain: tones -> master -> compressor -> destination
        master.connect(comp)
        comp.connect(ctx.destination)

        const makeTone = (
          freq: number,
          start: number,
          dur: number,
          peak: number,
          type: OscillatorType = 'triangle'
        ) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = type
          osc.frequency.value = freq
          gain.gain.value = 0.0001
          osc.connect(gain)
          gain.connect(master)

          const t0 = ctx.currentTime + start
          osc.start(t0)
          // envelope: stronger attack, longer sustain, slower decay
          gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.06)
          gain.gain.exponentialRampToValueAtTime(peak * 0.8, t0 + dur * 0.55)
          gain.gain.exponentialRampToValueAtTime(0.0002, t0 + dur)
          osc.stop(t0 + dur + 0.03)
        }

        // Arpeggio/chime sequence (~2.5s), higher peaks
        makeTone(660, 0.00, 1.1, 0.35, 'triangle')   // E5
        makeTone(880, 0.25, 1.2, 0.40, 'sawtooth')   // A5
        makeTone(990, 0.60, 1.1, 0.38, 'triangle')   // B5
        makeTone(1320, 1.00, 1.0, 0.36, 'square')    // E6

        // master gain envelope (stronger initial boost)
        const now = ctx.currentTime
        master.gain.exponentialRampToValueAtTime(0.01, now + 0.12)   // louder quickly
        master.gain.exponentialRampToValueAtTime(0.003, now + 2.8)   // fade out
      } catch {}
    }
  }, [doseModalOpen, pendingMed])

  const handleEmergencyCall = () => {
    try { window.location.href = `tel:${emergencyPhone.replace(/\D/g,'')}` } catch {}
    setEmergencyOpen(false)
  }

  return (
    <div className="home-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />

      <div className="home-welcome">
        <div className="welcome">
          <a
            href="#"
            className="welcome-link"
            onClick={(e) => { e.preventDefault(); onNavigate('profile') }}
            title="Ir para o perfil"
          >
            <span className="welcome-top">Bem-vindo(a),</span>{' '}<span className="welcome-name">{displayName}</span>
          </a>
        </div>
        <button type="button" className="cart-button" onClick={() => window.dispatchEvent(new Event('cart:open'))} aria-label="Abrir carrinho">
          <CartIcon count={count} />
        </button>
      </div>

      <div className="home-toolbar">
        <div className="search-wrapper">
          <SearchBar
            value={searchTerm}
            onChange={(v) => setSearchTerm(v)}
            onSubmit={() => { }}
          />
        </div>
        {(searchTerm.trim().length >= 2) && (
          <div className="search-results" aria-live="polite">
            {searching && <div className="search-status">Buscando...</div>}
            {!searching && searchError && <div className="search-error">{searchError}</div>}
            {!searching && !searchError && (medsFound.length === 0 && pharmsFound.length === 0) && (
              <div className="search-empty">Nenhum resultado</div>
            )}
            {!searching && !searchError && medsFound.length > 0 && (
              <div className="search-group">
                <div className="group-title">Medicamentos</div>
                <ul className="group-list">
                  {medsFound.map(m => (
                    <li key={m.id}>
                      <button type="button" className="search-item" onClick={() => onNavigate('store')}>
                        <span className="item-name" title={m.name}>{m.name}</span>
                        {m.stock > 0 ? (
                          <span className="item-meta">{m.stock} un • {(m.price_in_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
                        ) : (
                          <span className="item-meta out-of-stock">Fora de estoque</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!searching && !searchError && pharmsFound.length > 0 && (
              <div className="search-group">
                <div className="group-title">Farmácias</div>
                <ul className="group-list">
                  {pharmsFound.map(p => (
                    <li key={p.id}>
                      <button type="button" className="search-item" onClick={() => onNavigate('pharmacies')}>
                        <span className="item-name" title={p.name}>{p.name}</span>
                        {p.address && <span className="item-meta" title={p.address}>{p.address}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="home-banner">
        <img src="/banner.png" alt="Banner" />
      </div>

      <div className="home-medicines">
        <div className="meds-header">
          <h3 className="meds-title">Medicamentos</h3>
          <button
            type="button"
            className="see-all"
            onClick={() => onNavigate('medications')}
          >
            Ver tudo
          </button>
        </div>
        <div className="meds-row" role="list">
          {/* Card fixo de criação: mostra no início apenas quando não há itens */}
          {(!medsLoading && !medsError && meds.length === 0) && (
            <button
              type="button"
              className="create-card"
              role="listitem"
              aria-label="Criar medicamento"
              onClick={() => onNavigate('medications')}
            >
              <FaPlus className="icon" />
              <span>Criar</span>
            </button>
          )}
          {medsLoading &&
            Array.from({ length: isDesktop ? 6 : 4 }).map((_, i) => (
              <div key={i} className="med-card skeleton" />
            ))}
          {!medsLoading && medsError && <div className="med-error">{medsError}</div>}
          {!medsLoading && !medsError && meds.slice(0, isDesktop ? 6 : 4).map((m) => (
            <button
              key={m.id}
              type="button"
              className="med-card mini"
              role="listitem"
              aria-label={`Ver ${m.nome}`}
              onClick={() => onNavigate('medications')}
            >
              <div className="med-mini-header">
                <span className="med-name" title={m.nome}>{m.nome}</span>
                {typeof m.frequencia_horas === 'number' && m.frequencia_horas > 0 && (
                  <span className="med-freq" title={`Frequência: ${m.frequencia_horas} horas`}>{m.frequencia_horas}h</span>
                )}
              </div>

              {/* Nome do paciente somente para cuidadores */}
              {isCarer && m.user_id && elderNames[m.user_id] && (
                <span className="med-desc" title={`Paciente: ${elderNames[m.user_id]}`}>
                  Paciente: {elderNames[m.user_id]}
                </span>
              )}

              <span className="med-desc" title={`Dose: ${m.dose}`}>Dose: {m.dose}</span>
              <div className="med-meta-line">
                <span className="med-stock">Estoque: {m.estoque}</span>
              </div>
            </button>
          ))}
          {/* Card fixo de criação no final quando houver itens */}
          {(!medsLoading && !medsError && meds.length > 0) && (
            <button
              type="button"
              className="create-card"
              role="listitem"
              aria-label="Criar medicamento"
              onClick={() => onNavigate('medications')}
            >
              <FaPlus className="icon" />
              <span>Criar</span>
            </button>
          )}
        </div>
      </div>

      {isDesktop && (
        <div className="home-consultations">
          <div className="consult-header">
            <h3 className="consult-title">Consultas</h3>
            <button type="button" className="see-all" onClick={() => onNavigate('consultas')}>Ver tudo</button>
          </div>
          <div className="consult-row" role="list" aria-label="Lista de consultas">
            {/* Card fixo de criação: mostra no início apenas quando não há itens */}
            {(!consultLoading && !consultError && consultations.length === 0) && (
              <button
                type="button"
                className="create-card"
                role="listitem"
                aria-label="Criar consulta"
                onClick={() => onNavigate('consultas')}
              >
                <FaPlus className="icon" />
                <span>Criar</span>
              </button>
            )}
            {consultLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="consult-card skeleton" />
            ))}
            {!consultLoading && consultError && <div className="consult-error" role="alert">{consultError}</div>}
            {!consultLoading && !consultError && consultations.slice(0,6).map(c => (
              <button
                key={c.id}
                type="button"
                className="consult-card"
                role="listitem"
                aria-label={`Ver consulta ${c.name}`}
                onClick={() => onNavigate('consultas')}
              >
                <div className="consult-mini-header">
                  {/* Não usar c.name no header; mostrar especialidade ou rótulo genérico */}
                  <span
                    className="consult-name"
                    title={c.specialty || 'Consulta'}
                  >
                    {c.specialty || 'Consulta'}
                  </span>
                  <span className="consult-type" title={c.type}>{c.type}</span>
                </div>

                {/* Mostrar nome do idoso apenas para cuidadores */}
                {isCarer && (
                  <span className="consult-patient" title={`Paciente: ${c.name}`}>
                    {c.name}
                  </span>
                )}

                {c.doctor_name && (
                  <span className="consult-doc" title={`Médico: ${c.doctor_name}`}>Dr(a). {c.doctor_name}</span>
                )}
                <span className="consult-date" title={c.date}>
                  {new Date(c.date).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </span>
              </button>
            ))}
            {/* Card fixo de criação no final quando houver itens */}
            {(!consultLoading && !consultError && consultations.length > 0) && (
              <button
                type="button"
                className="create-card"
                role="listitem"
                aria-label="Criar consulta"
                onClick={() => onNavigate('consultas')}
              >
                <FaPlus className="icon" />
                <span>Criar</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="home-bottom">
        <div className="home-emergency">
          <button type="button" className="home-action-button emergency" aria-label="Emergência" onClick={() => setEmergencyOpen(true)}>
            <MdEmergency className="icon" />
            <span>Emergência</span>
          </button>
        </div>
        <div className="home-actions">
          <button
            type="button"
            className="home-action-button primary"
            aria-label="Consultas"
            onClick={() => onNavigate('pharmacies')}
          >
            <FaClinicMedical className="icon" />
            <span>Farmácias</span>
          </button>
          <button type="button" className="home-action-button" aria-label="Consultas" onClick={() => onNavigate('consultas')}>
            <FaCalendarAlt className="icon" />
            <span>Consultas</span>
          </button>
          <button
            type="button"
            className="home-action-button"
            aria-label="Medicamentos"
            onClick={() => onNavigate('medications')}
          >
            <FaPills className="icon" />
            <span>Medicamentos</span>
          </button>
        </div>
        {isCarer && (
          <div className="home-role">
            <button
              type="button"
              className="home-action-button role"
              aria-label="Cuidador"
              onClick={() => onNavigate('cuidador')}
            >
              <FaUser className="icon" />
              <span>Cuidador</span>
            </button>
          </div>
        )}
      </div>

      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={onNavigate}
        activePage="home"
      />

      {doseModalOpen && pendingMed && (
        <Modal
          open={doseModalOpen}
          onClose={() => { /* bloqueia fechamento pelo fundo/ESC */ }}
          title="Hora do medicamento"
          width={480}
        >
          <div className="form">
            <div className="modal-field">
              <div className="modal-label">Você precisa tomar:</div>
              <div className="modal-input" style={{ display:'block' }}>
                <strong>{pendingMed.nome}</strong>
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Dose</div>
              <div className="modal-input" style={{ display:'block' }}>
                {pendingMed.dose}
              </div>
            </div>
            {typeof pendingMed.frequencia_horas === 'number' && pendingMed.frequencia_horas > 0 && (
              <div className="modal-field">
                <div className="modal-label">Frequência</div>
                <div className="modal-input" style={{ display:'block' }}>
                  A cada {pendingMed.frequencia_horas} hora(s)
                </div>
              </div>
            )}
          </div>
          <ModalFooter>
            <ModalAction onClick={confirmDoseTaken} disabled={doseSaving} style={{ width: '100%' }}>
              {doseSaving ? 'Confirmando...' : 'Tomei agora'}
            </ModalAction>
          </ModalFooter>
        </Modal>
      )}
      {emergencyOpen && (
        <Modal
          open={emergencyOpen}
          onClose={() => setEmergencyOpen(false)}
          title="Emergência"
          width={420}
        >
          <div className="form">
            <div className="modal-field">
              <div className="modal-label">Confirmar pedido de emergência</div>
              <div className="modal-input" style={{ display:'block' }}>
                Ao confirmar, o discador será aberto para ligar para {emergencyPhone}.
              </div>
            </div>
          </div>
          <ModalFooter>
            <ModalAction $variant="secondary" onClick={() => setEmergencyOpen(false)}>Cancelar</ModalAction>
            <ModalAction onClick={handleEmergencyCall}>Ligar agora</ModalAction>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}

export default Home
