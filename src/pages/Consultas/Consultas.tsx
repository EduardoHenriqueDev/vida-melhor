import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import './Consultas.css'
import { FaPlus } from 'react-icons/fa'
import Modal, { ModalFooter, ModalAction } from '../../components/Modal/Modal'
import FancyCard from '../../components/FancyCard/FancyCard'

interface ConsultasProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications' | 'consultas' | 'store') => void
}

interface ConsultationRow {
  id: string
  user_id: string
  name: string
  date: string
  type: string
  created_at: string
  doctor_name?: string | null
  specialty?: string | null
}

interface ElderProfile {
  id: string
  name: string
}

const Consultas = ({ onBack, onNavigate }: ConsultasProps) => {
  const [displayName, setDisplayName] = useState('')
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [formDateTime, setFormDateTime] = useState('')
  const [formMode, setFormMode] = useState<'presencial' | 'telemedicina' | ''>('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [isCarer, setIsCarer] = useState(false)
  const [consultations, setConsultations] = useState<ConsultationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [linkedElders, setLinkedElders] = useState<ElderProfile[]>([])
  const [selectedElderId, setSelectedElderId] = useState<string>('')

  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState('')

  const loadConsultations = async (uid: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('consultation')
        .select('id,user_id,name,date,type,created_at,doctor_name,specialty')
        .eq('user_id', uid)
        .order('date', { ascending: false })

      if (error) throw error
      setConsultations(data || [])
    } catch (e: any) {
      setLoadError(e?.message || 'Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  const loadConsultationsForIds = async (uids: string[]) => {
    setLoading(true)
    setLoadError(null)
    try {
      if (!uids.length) return setConsultations([])

      const { data, error } = await supabase
        .from('consultation')
        .select('id,user_id,name,date,type,created_at,doctor_name,specialty')
        .in('user_id', uids)
        .order('date', { ascending: false })

      if (error) throw error
      setConsultations(data || [])
    } catch (e: any) {
      setLoadError(e?.message || 'Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name

      setDisplayName(name || user?.email || 'Usuário')

      // Detecta cuidador apenas via profiles.carer
      let carerFlag = false
      if (user?.id) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('carer')
          .eq('id', user.id)
          .maybeSingle()
        if (!error && prof) carerFlag = !!(prof as any).carer
      }

      setIsCarer(carerFlag)

      if (user?.id) {
        // sempre carrega consultas do próprio usuário
        let own: ConsultationRow[] = []
        try {
          const { data: ownData } = await supabase
            .from('consultation')
            .select('id,user_id,name,date,type,created_at,doctor_name,specialty')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
          own = (ownData || []) as ConsultationRow[]
        } catch {}

        // se cuidador, acrescenta consultas dos idosos vinculados
        let elderRows: ConsultationRow[] = []
        if (carerFlag) {
          try {
            const { data: elders } = await supabase
              .from('profiles')
              .select('id,name')
              .eq('carer_id', user.id)
              .order('name', { ascending: true })
            setLinkedElders(elders || [])
            const ids = (elders || []).map(e => e.id)
            if (ids.length) {
              const { data: eldersConsults } = await supabase
                .from('consultation')
                .select('id,user_id,name,date,type,created_at,doctor_name,specialty')
                .in('user_id', ids)
                .order('date', { ascending: false })
              elderRows = (eldersConsults || []) as ConsultationRow[]
            }
          } catch {
            setLinkedElders([])
          }
        }

        // une e ordena por data desc
        const all = [...own, ...elderRows].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setConsultations(all)
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleBack = () => {
    onBack?.() || onNavigate?.('home')
  }

  const handleSave = async () => {
    setFormError(null)

    // validações
    if (isCarer) {
      if (!selectedElderId || !formDateTime || !formMode) {
        setFormError('Selecione o idoso, data/hora e tipo.')
        return
      }
    } else if (!formDateTime || !formMode) {
      setFormError('Preencha data e tipo.')
      return
    }

    try {
      setSaving(true)

      const { data: userResp } = await supabase.auth.getUser()
      const user = userResp.user
      if (!user) throw new Error('Sessão expirada')

      const targetUserId = isCarer ? selectedElderId : user.id

      const targetName = isCarer
        ? linkedElders.find(e => e.id === selectedElderId)?.name || 'Idoso'
        : displayName

      const isoDateTime =
        formDateTime.length === 16
          ? `${formDateTime}:00`
          : formDateTime

      const payload = {
        user_id: targetUserId,
        name: targetName,
        date: isoDateTime,
        type: formMode,
        doctor_name: doctorName.trim() || null,
        specialty: specialty.trim() || null
      }

      const { error } = await supabase
        .from('consultation')
        .insert(payload)

      if (error) throw error

      setModalOpen(false)

      setFormDateTime('')
      setFormMode('')
      setSelectedElderId('')
      setDoctorName('')
      setSpecialty('')

      if (isCarer) {
        const ids = linkedElders.map(e => e.id)
        await loadConsultationsForIds(ids)
      } else {
        await loadConsultations(user.id)
      }
    } catch (e: any) {
      setFormError(e?.message || 'Falha ao salvar consulta')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    const [datePart, timePartRaw] = iso.split('T')
    const [y, m, d] = datePart.split('-')
    const timePart = timePartRaw?.slice(0, 5)
    const base = `${d}/${m}/${y}`
    return timePart ? `${base} ${timePart}` : base
  }

  const formatSpecialty = (v?: string | null) =>
    !v
      ? '—'
      : v.replace(/_/g, ' ').replace(/\b(\w)/g, s => s.toUpperCase())

  return (
    <div className={"consultas-container" + (isCarer ? '' : ' not-carer')}>
      <Navbar
        onSignOut={() => {}}
        onOpenMenu={() => setOpen(true)}
        onNavigate={onNavigate}
      />

      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={() => {}}
        onNavigate={onNavigate}
        activePage="consultas"
      />

      <div className="consultas-header">
        <button className="back-icon-btn" onClick={handleBack}>
          <svg width="28" height="28" viewBox="0 0 24 24">
            <polyline
              points="15 18 9 12 15 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="title">Consultas</h2>
      </div>

      {loading && <div className="consultas-status">Carregando consultas...</div>}

      {!loading && loadError && (
        <div className="consultas-error">{loadError}</div>
      )}

      {!loading && !loadError && consultations.length === 0 && (
        <div className="consultas-empty">
          Nenhuma consulta cadastrada.
        </div>
      )}

      {!loading && !loadError && consultations.length > 0 && (
        <div className="grid">
          {consultations.map(c => (
            <FancyCard
              key={c.id}
              title=""
              className="card consult-card"
              width="100%"
              height="auto"
            >
              <div className="card-body">
                {isCarer && <h3 className="name">{c.name}</h3>}
                <div className="consultation-meta">
                  <span className="consultation-date">{formatDate(c.date)}</span>
                  <span className={`consultation-badge ${c.type}`}>
                    {c.type === 'presencial' ? 'Presencial' : 'Telemedicina'}
                  </span>
                </div>
                {(c.doctor_name || c.specialty) && (
                  <div className="consultation-extra">
                    {c.doctor_name && (
                      <div className="consultation-doctor">Dr(a). {c.doctor_name}</div>
                    )}
                    {c.specialty && (
                      <div className="consultation-specialty">
                        {formatSpecialty(c.specialty)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FancyCard>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setModalOpen(true)}>
        <FaPlus className="icon" />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova consulta"
        width={520}
      >
        <div className="form">
          {isCarer && (
            <div className="modal-field">
              <label className="modal-label">Selecione o idoso</label>
              <select
                className="modal-select"
                value={selectedElderId}
                onChange={e => setSelectedElderId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {linkedElders.map(el => (
                  <option key={el.id} value={el.id}>
                    {el.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!isCarer && (
            /* Campo nome oculto para contas normais, preenchido com displayName */
            <input type="hidden" value={displayName} readOnly />
          )}

          <div className="modal-field">
            <label className="modal-label">Data e hora</label>
            <input
              className="modal-input"
              type="datetime-local"
              value={formDateTime}
              onChange={e => setFormDateTime(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Nome do médico</label>
            <input
              className="modal-input"
              type="text"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Especialidade</label>
            <input
              className="modal-input"
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <span className="modal-label">Tipo</span>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="tipo"
                  value="presencial"
                  checked={formMode === 'presencial'}
                  onChange={() => setFormMode('presencial')}
                />
                <span>Presencial</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="tipo"
                  value="telemedicina"
                  checked={formMode === 'telemedicina'}
                  onChange={() => setFormMode('telemedicina')}
                />
                <span>Telemedicina</span>
              </label>
            </div>
          </div>

          {formError && (
            <div className="modal-error">{formError}</div>
          )}
        </div>

        <ModalFooter>
          <ModalAction
            $variant="secondary"
            onClick={() => setModalOpen(false)}
            disabled={saving}
          >
            Cancelar
          </ModalAction>

          <ModalAction
            onClick={handleSave}
            disabled={
              saving ||
              (isCarer && !selectedElderId) ||
              !formDateTime ||
              !formMode
            }
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </ModalAction>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Consultas
