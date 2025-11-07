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

const Consultas = ({ onBack, onNavigate }: ConsultasProps) => {
  const [displayName, setDisplayName] = useState('')
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formMode, setFormMode] = useState<'presencial' | 'telemedicina' | ''>('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isCarer, setisCarer] = useState(false)

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
    }
    loadUser()
    // registra página anterior e atual
  }, [])

  const handleBack = () => {
    onBack ? onBack() : onNavigate?.('home')
  }

  const handleSave = async () => {
    setFormError(null)
    if (!formName.trim() || !formDate || !formMode) {
      setFormError('Preencha todos os campos.')
      return
    }
    try {
      setSaving(true)
      // Aqui você pode salvar no Supabase; por enquanto, apenas feedback rápido
      alert('Consulta marcada com sucesso!')
      setModalOpen(false)
      setFormName('')
      setFormDate('')
      setFormMode('')
    } finally {
      setSaving(false)
    }
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

      <div className="grid">
        <div className="card">
          <div className="card-body">
            <h3 className="name">Minha primeira consulta</h3>
            <p className="desc">Conteúdo de exemplo. Personalize esta tela com sua lógica de consultas.</p>
          </div>
        </div>
      </div>

      <button type="button" className="fab" aria-label="Nova consulta" onClick={() => setModalOpen(true)}>
        <FaPlus className="icon" />
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova consulta" width={520}>
        <div className="form">
          <div className="modal-field">
            <label htmlFor="nomeIdoso" className="modal-label">{isCarer ? 'Nome do idoso' : 'Nome do cuidador'}</label>
            <input
              id="nomeIdoso"
              className="modal-input"
              type="text"
              placeholder={isCarer ? 'Digite o nome do idoso' : 'Digite o nome do cuidador'}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="diaConsulta" className="modal-label">Dia da consulta</label>
            <input
              id="diaConsulta"
              className="modal-input"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
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
          <ModalAction onClick={handleSave} disabled={saving || !formName.trim() || !formDate || !formMode}>
            {saving ? 'Salvando...' : 'Salvar'}
          </ModalAction>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Consultas