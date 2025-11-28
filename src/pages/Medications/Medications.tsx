// filepath: c:\vida-melhor\src\pages\Medications\Medications.tsx
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import { signOut } from '../../services/authService'
import './Medications.css'
import Modal, { ModalAction } from '../../components/Modal/Modal'
import { FaPlus } from 'react-icons/fa'
import FancyCard from '../../components/FancyCard/FancyCard'

interface MedicineRow {
  id: number
  user_id: string
  nome: string
  dose: string
  estoque: number
  ultima_dose: string | null
  frequencia_horas?: number | null
}

interface MedicationsProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'store' | 'consultas') => void
}

const Medications = ({ onBack, onNavigate }: MedicationsProps) => {
  const [displayName, setDisplayName] = useState('')
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [items, setItems] = useState<MedicineRow[]>([])

  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [dose, setDose] = useState('')
  const [estoque, setEstoque] = useState<number>(0)
  const [ultimaDose, setUltimaDose] = useState<string>('') // datetime-local
  const [frequenciaHoras, setFrequenciaHoras] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // modo do modal e id em edição
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)

  // helper para converter ISO -> datetime-local (horário local)
  const toDatetimeLocal = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    return val
  }

  const openCreateModal = () => {
    setModalMode('create')
    setEditingId(null)
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (m: MedicineRow) => {
    setModalMode('edit')
    setEditingId(m.id)
    setNome(m.nome || '')
    setDose(m.dose || '')
    setEstoque(Number.isFinite(m.estoque) ? m.estoque : 0)
    setUltimaDose(toDatetimeLocal(m.ultima_dose))
    setFrequenciaHoras((m.frequencia_horas ?? 0) as number)
    setSaveError(null)
    setModalOpen(true)
  }

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const name = (user?.user_metadata as any)?.name as string | undefined
      setDisplayName(name || user?.email || 'Usuário')
      setUserId(user?.id || '')
    }
    loadUser()
  }, [])

  useEffect(() => {
    
    if (!userId) return
    let cancelled = false
    const loadMeds = async () => {
      setListLoading(true)
      setListError(null)
      try {
        const { data, error } = await supabase
          .from('medicines')
          .select('id,user_id,nome,dose,estoque,ultima_dose,frequencia_horas')
          .eq('user_id', userId)
          .order('id', { ascending: false })
        if (error) throw error
        if (!cancelled) setItems((data as MedicineRow[]) || [])
      } catch (e: any) {
        if (!cancelled) setListError(e?.message || 'Erro ao carregar medicamentos')
      } finally {
        if (!cancelled) setListLoading(false)
      }
    }
    loadMeds()
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => { /* removido registro prev/last_page para usar histórico do App */ }, [])
  const handleSignOut = async () => { await signOut() }
  const handleBack = () => { onBack ? onBack() : onNavigate?.('home') }

  // Wrapper para satisfazer Sidebar que pode navegar para 'medications'
  const sidebarNavigate = (
    page: 'home' | 'profile' | 'pharmacies' | 'store' | 'cuidador' | 'consultas' | 'medications'
  ) => {
    const mapped = page === 'medications' ? 'store' : page
    onNavigate?.(mapped)
  }

  const resetForm = () => {
    setNome('')
    setDose('')
    setEstoque(0)
    setUltimaDose('')
    setFrequenciaHoras(0)
    setSaveError(null)
  }

  const handleSubmit = async () => {
    if (!userId) { setSaveError('Sessão expirada'); return }
    if (!nome.trim() || !dose.trim()) { setSaveError('Preencha nome e dose'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const freq = Number.isFinite(frequenciaHoras) ? Math.max(0, Math.floor(frequenciaHoras)) : 0
      const payload: any = {
        user_id: userId,
        nome: nome.trim(),
        dose: dose.trim(),
        estoque: Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : 0,
        frequencia_horas: freq > 0 ? freq : null,
      }
      if (ultimaDose && ultimaDose.trim()) {
        const iso = new Date(ultimaDose).toISOString()
        payload.ultima_dose = iso
      } else {
        payload.ultima_dose = null
      }

      if (modalMode === 'edit' && editingId != null) {
        const { data, error } = await supabase
          .from('medicines')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', userId)
          .select('id,user_id,nome,dose,estoque,ultima_dose,frequencia_horas')
          .single()
        if (error) throw error
        if (data) {
          setItems(prev => prev.map(it => it.id === editingId ? (data as MedicineRow) : it))
        }
      } else {
        const { data, error } = await supabase
          .from('medicines')
          .insert(payload)
          .select('id,user_id,nome,dose,estoque,ultima_dose,frequencia_horas')
          .single()
        if (error) throw error
        if (data) setItems(prev => [data as MedicineRow, ...prev])
      }
      setModalOpen(false)
      setModalMode('create')
      setEditingId(null)
      resetForm()
    } catch (e: any) {
      setSaveError(e?.message || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (editingId == null) return
    if (!window.confirm('Apagar este medicamento?')) return
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', editingId)
        .eq('user_id', userId)
      if (error) throw error
      setItems(prev => prev.filter(it => it.id !== editingId))
      setModalOpen(false)
      setModalMode('create')
      setEditingId(null)
      resetForm()
    } catch (e: any) {
      setSaveError(e?.message || 'Falha ao apagar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="store-container">
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => setOpen(true)} onNavigate={onNavigate} />
      <Sidebar
        open={open}
        displayName={displayName}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
        onNavigate={sidebarNavigate}
      />

      <div className="store-header">
        <button type="button" className="back-icon-btn" onClick={handleBack} aria-label="Voltar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="title">Medicamentos</h2>
      </div>

      {listLoading && (
        <div style={{ padding: '0 1rem', color: '#374151', fontSize: '.85rem' }}>Carregando medicamentos...</div>
      )}
      {!listLoading && listError && (
        <div style={{ padding: '0 1rem', color: '#b91c1c', fontSize: '.85rem' }}>{listError}</div>
      )}
      {!listLoading && !listError && items.length === 0 && (
        <div style={{ padding: '0 1rem', color: '#6b7280', fontSize: '.9rem' }}>Nenhum medicamento cadastrado.</div>
      )}
      {!listLoading && !listError && items.length > 0 && (
        <div className="grid">
          {items.map((m) => (
            <FancyCard
              key={m.id}
              title=""
              className="card med-card"
              width="100%"
              height="auto"
              role="button"
              tabIndex={0}
              onClick={() => openEditModal(m)}
            >
              <div className="card-header">
                <h3 className="name" title={m.nome}>{m.nome}</h3>
                <div style={{display:'flex', gap:'.35rem', alignItems:'center'}}>
                  {m.frequencia_horas ? (
                    <span className="freq-badge" title={`A cada ${m.frequencia_horas} horas`}>{m.frequencia_horas}h</span>
                  ) : null}
                  {m.ultima_dose ? (
                    <span className="last-badge" title={`Última dose: ${new Date(m.ultima_dose).toLocaleString('pt-BR')}`}>
                      última: {new Date(m.ultima_dose).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="card-body">
                <div className="meta">Dose: <strong>{m.dose}</strong></div>
                <div className="meta">Estoque: <strong>{m.estoque}</strong></div>
                {m.ultima_dose && (
                  <div className="meta">Última dose: <strong>{new Date(m.ultima_dose).toLocaleString('pt-BR')}</strong></div>
                )}
                {m.frequencia_horas !== null && (
                  <div className="meta">Frequência: <strong>{m.frequencia_horas} horas</strong></div>
                )}
              </div>
            </FancyCard>
          ))}
        </div>
      )}

      <button type="button" className="fab" aria-label="Adicionar medicamento" onClick={openCreateModal}>
        <FaPlus className="icon" />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => { if (!saving) { setModalOpen(false); setModalMode('create'); setEditingId(null); resetForm() } }}
        title={modalMode === 'edit' ? 'Editar medicamento' : 'Novo medicamento'}
      >
        <form className="form" onSubmit={(e)=>{ e.preventDefault(); if(!saving) handleSubmit() }} aria-describedby="form-ajuda">
          <div id="form-ajuda" style={{fontSize:'.8rem',color:'#374151',marginBottom:'.75rem', lineHeight:'1.3'}}>
            Preencha os dados do seu remédio. Use informações simples para facilitar futuras consultas.
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="nome">Nome do medicamento</label>
            <input id="nome" className="modal-input" value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Ex.: Losartana" required aria-describedby="help-nome" />
            <small id="help-nome" className="field-help">Digite o nome pelo qual você reconhece o remédio.</small>
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="dose">Dose</label>
            <input id="dose" className="modal-input" value={dose} onChange={(e)=>setDose(e.target.value)} placeholder="Ex.: 50 mg (1 comprimido)" required aria-describedby="help-dose" />
            <small id="help-dose" className="field-help">Informe a quantidade que você toma de cada vez.</small>
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="estoque">Estoque atual (quantos restam)</label>
            <input id="estoque" className="modal-input" type="number" min={0} step={1} value={Number.isFinite(estoque)?estoque:0} onChange={(e)=>setEstoque(parseInt(e.target.value||'0',10))} aria-describedby="help-estoque" />
            <small id="help-estoque" className="field-help">Número de comprimidos ou doses que você ainda tem.</small>
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="freq">Frequência (de quantas em quantas horas)</label>
            <input
              id="freq"
              className="modal-input"
              type="number"
              min={1}
              step={1}
              placeholder="Ex.: 8 para a cada 8 horas"
              value={Number.isFinite(frequenciaHoras) ? frequenciaHoras : 0}
              onChange={(e)=> setFrequenciaHoras(parseInt(e.target.value || '0', 10))}
              aria-describedby="help-freq"
            />
            <small id="help-freq" className="field-help">Coloque o número de horas entre uma dose e outra. Ex.: 8 significa tomar a cada 8 horas.</small>
          </div>
          {saveError && <div className="modal-error" role="alert">{saveError}</div>}
          <div style={{ display:'flex', justifyContent:'space-between', gap:'.5rem' }}>
            {modalMode === 'edit' ? (
              <ModalAction type="button" $variant="secondary" onClick={handleDelete} style={{ background:'#dc2626', color:'#fff' }}>Apagar</ModalAction>
            ) : <span />}
            <div style={{ display:'flex', gap:'.5rem' }}>
              <ModalAction type="button" $variant="secondary" onClick={() => { if (!saving) { setModalOpen(false); setModalMode('create'); setEditingId(null); resetForm() } }}>Cancelar</ModalAction>
              <ModalAction type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</ModalAction>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Medications
