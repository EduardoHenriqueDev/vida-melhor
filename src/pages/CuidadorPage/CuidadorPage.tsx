import React from 'react'

interface CuidadorPageProps {
  onSignOut: () => void
  onNavigate: (page: 'home' | 'profile' | 'cuidador') => void
}

const CuidadorPage = ({ onSignOut, onNavigate }: CuidadorPageProps) => {
  return (
    <div className="home-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: '#197771' }}>Tela do Cuidador</h1>
      <p>Conteúdo para o cuidador será exibido aqui.</p>
      <button onClick={() => onNavigate('home')} style={{ marginTop: '2rem', background: '#197771', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>Voltar para Home</button>
    </div>
  )
}

export default CuidadorPage
