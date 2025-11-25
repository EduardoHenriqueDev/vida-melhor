import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import './Consultas.css'
import { FaPlus } from 'react-icons/fa'
import Modal, { ModalFooter, ModalAction } from '../../components/Modal/Modal'

interface ConsultasProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications' | 'consultas' | 'store') => void
}
interface ConsultationRow { id: string; user_id: string; name: string; date: string; type: string; created_at: string; doctor_name?: string | null; specialty?: string | null }
interface ElderProfile { id: string; name: string }

const Consultas = ({ onBack, onNavigate }: ConsultasProps) => {
  const [displayName, setDisplayName] = useState('')
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDateTime, setFormDateTime] = useState('')
  const [formMode, setFormMode] = useState<'presencial' | 'telemedicina' | ''>('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isCarer, setisCarer] = useState(false)
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
      setConsultations((data || []) as ConsultationRow[])
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
      if (!uids || uids.length === 0) { setConsultations([]); return }
      const { data, error } = await supabase
        .from('consultation')
        .select('id,user_id,name,date,type,created_at,doctor_name,specialty')
        .in('user_id', uids)
        .order('date', { ascending: false })
      if (error) throw error
      setConsultations((data || []) as ConsultationRow[])
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
      const name = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(name || user?.email || 'Usuário')

      // Descobre se é cuidador pelo perfil; fallback para metadata
      let roleFlag = !!(user?.user_metadata as any)?.role
      if (user?.id) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (!error && prof) roleFlag = !!(prof as any).role
      }
      setisCarer(!!roleFlag)

      if (user?.id) {
        if (roleFlag) {
          try {
            const { data: elders, error } = await supabase
              .from('profiles')
              .select('id,name')
              .eq('carer_id', user.id)
              .order('name', { ascending: true })
            if (!error && elders) {
              setLinkedElders(elders as ElderProfile[])
              const ids = (elders as ElderProfile[]).map(e => e.id)
              await loadConsultationsForIds(ids)
            } else {
              setLinkedElders([])
              setConsultations([])
            }
          } catch {
            setLinkedElders([])
            setConsultations([])
          }
        } else {
          loadConsultations(user.id)
        }
      }
    }
    loadUser()
    // registra página anterior e atual
  }, [])

  const handleBack = () => {
    onBack ? onBack() : onNavigate?.('home')
  }

  const handleSave = async () => {
    setFormError(null)
    // validação diferenciada para cuidador
    if (isCarer) {
      if (!selectedElderId || !formDateTime || !formMode) {
        setFormError('Selecione o idoso, a data/hora e o tipo.')
        return
      }
    } else if (!formName.trim() || !formDateTime || !formMode) {
      setFormError('Preencha todos os campos.')
      return
    }
    try {
      setSaving(true)
      const { data: userResp } = await supabase.auth.getUser()
      const user = userResp.user
      if (!user) throw new Error('Sessão expirada')

      const targetUserId = isCarer && selectedElderId ? selectedElderId : user.id
      const targetName = isCarer && selectedElderId ? (linkedElders.find(e => e.id === selectedElderId)?.name || 'Idoso') : formName.trim()

      const isoDateTime = formDateTime.length === 16 ? `${formDateTime}:00` : formDateTime

      const payload: any = {
        user_id: targetUserId,
        name: targetName,
        date: isoDateTime,
        type: formMode,
        doctor_name: (doctorName || '').trim() || null,
        specialty: (specialty || '') || null,
      }
      const { error } = await supabase.from('consultation').insert(payload)
      if (error) throw error

      setModalOpen(false)
      setFormName('')
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
    const [datePart, timePartRaw] = (iso || '').split('T')
    const [y, m, d] = (datePart || '').split('-')
    if (!y || !m || !d) return '—'
    const timePart = (timePartRaw || '').slice(0,5)
    const base = `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`
    return timePart ? `${base} ${timePart}` : base
  }
  const formatSpecialty = (value?: string | null) => {
    if (!value) return '—'
    return value.replace(/_/g,' ').replace(/\b(\w)/g, s => s.toUpperCase())
  }

  return (
    <div className="consultas-container">
      <Navbar onSignOut={() => {}} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />
      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={() => {}}
        onNavigate={onNavigate}
        activePage="consultas"
      />

      <div className="consultas-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Consultas</h2>
      </div>

      {loading && <div className="consultas-status">Carregando consultas...</div>}
      {!loading && loadError && <div className="consultas-error">{loadError}</div>}
      {!loading && !loadError && consultations.length === 0 && (
        <div className="consultas-empty">Nenhuma consulta cadastrada.</div>
      )}

      {!loading && !loadError && consultations.length > 0 && (
        <div className="grid">
          {consultations.map(c => (
            <div key={c.id} className="card">
              <div className="card-body">
                <h3 className="name" title={c.name}>{c.name}</h3>
                <div className="consultation-meta">
                  <span className="consultation-date">{formatDate(c.date)}</span>
                  <span className={`consultation-badge ${c.type}`}>{c.type === 'presencial' ? 'Presencial' : 'Telemedicina'}</span>
                </div>
                {(c.doctor_name || c.specialty) && (
                  <div className="consultation-extra">
                    {c.doctor_name && <div className="consultation-doctor" title={c.doctor_name}>Dr(a). {c.doctor_name}</div>}
                    {c.specialty && <div className="consultation-specialty" title={formatSpecialty(c.specialty)}>{formatSpecialty(c.specialty)}</div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="fab" aria-label="Nova consulta" onClick={() => setModalOpen(true)}>
        <FaPlus className="icon" />
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova consulta" width={520}>
        <div className="form">
          <div className="modal-field">
            <label htmlFor="nomeIdoso" className="modal-label">{isCarer ? 'Selecione o idoso' : 'Nome do cuidador'}</label>
            {isCarer ? (
              <select
                id="nomeIdoso"
                className="modal-select"
                value={selectedElderId}
                onChange={(e) => setSelectedElderId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {linkedElders.map(el => (
                  <option key={el.id} value={el.id}>{el.name || 'Sem nome'}</option>
                ))}
              </select>
            ) : (
              <input
                id="nomeIdoso"
                className="modal-input"
                type="text"
                placeholder={isCarer ? 'Digite o nome do idoso' : 'Digite o nome'}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            )}
          </div>

          <div className="modal-field">
            <label htmlFor="dataHoraConsulta" className="modal-label">Data e hora da consulta</label>
            <input
              id="dataHoraConsulta"
              className="modal-input"
              type="datetime-local"
              value={formDateTime}
              onChange={(e) => setFormDateTime(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="nomeMedico" className="modal-label">Nome do médico</label>
            <input
              id="nomeMedico"
              className="modal-input"
              type="text"
              placeholder="Ex.: Dr. João Silva"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="especialidade" className="modal-label">Especialidade</label>
            <input
              id="especialidade"
              className="modal-input"
              type="text"
              placeholder="Ex.: Urologista, Ginecologista, Clínico geral"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
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
          {formError && <div className="modal-error" role="alert">{formError}</div>}
        </div>
        <ModalFooter>
          <ModalAction $variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</ModalAction>
          <ModalAction onClick={handleSave} disabled={saving || (!isCarer && !formName.trim()) || (isCarer && !selectedElderId) || !formDateTime || !formMode}>
            {saving ? 'Salvando...' : 'Salvar'}
          </ModalAction>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Consultas