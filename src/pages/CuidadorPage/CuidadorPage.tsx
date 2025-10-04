interface CuidadorPageProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'cuidador' | 'pharmacies' | 'medications') => void
}

const CuidadorPage = ({ onSignOut, onNavigate }: CuidadorPageProps) => {
  return (
    <div className="home-container" style={{ padding: '2rem', textAlign: 'center' }}>
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
