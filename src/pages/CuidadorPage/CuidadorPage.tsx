import Navbar from '../../components/Navbar/Navbar'
import Sidebar from '../../components/Sidebar/Sidebar'

interface CuidadorPageProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications') => void
}

const CuidadorPage = ({ onSignOut, onNavigate }: CuidadorPageProps) => {
  const handleSignOut = async () => { onSignOut() }
  const displayName = ''
  const open = false
  return (
    <div className="home-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <Navbar onSignOut={handleSignOut} onOpenMenu={() => {}} onNavigate={onNavigate} />
      <Sidebar open={open} displayName={displayName} onClose={() => {}} onSignOut={handleSignOut} onNavigate={onNavigate} activePage="cuidador" />
      <h1 style={{ color: 'var(--primary-color)' }}>Tela do Cuidador</h1>
      <p>Conteúdo para o cuidador será exibido aqui.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'linear-gradient(90deg,var(--primary-color),var(--secondary-color))', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>Home</button>
        <button onClick={() => onNavigate('medications')} style={{ background: 'linear-gradient(90deg,var(--primary-color),var(--secondary-color))', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>Medicamentos</button>
        <button onClick={onSignOut} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>Sair</button>
      </div>
    </div>
  )
}

export default CuidadorPage
