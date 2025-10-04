import React, { type ReactNode, useEffect } from 'react'
import styled from 'styled-components'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string | number
}

const Backdrop = styled.div<{ $open:boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
  opacity: ${p=>p.$open?1:0};
  pointer-events: ${p=>p.$open? 'auto':'none'};
  transition: opacity .2s ease;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 1rem; /* allow small gutter on mobile */
  z-index: 999;
`

const Dialog = styled.div<{ $open:boolean; $width?:string|number }>`
  background:#fff;
  width: 100%;
  max-width: ${p=> typeof p.$width === 'number' ? p.$width + 'px' : (p.$width || '520px')};
  border-radius: 16px;
  box-shadow: 0 8px 28px -4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(${p=>p.$open? '0':'8px'});
  opacity: ${p=>p.$open?1:0};
  transition: opacity .22s ease, transform .22s ease;
  display:flex;
  flex-direction:column;
  max-height: calc(100vh - 2rem);
  overflow:hidden;
  position:relative;
`

const Header = styled.div`
  padding: 1rem 1.25rem 0.75rem;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:.75rem;
  border-bottom:1px solid #f1f5f9;
`

const Title = styled.h3`
  margin:0;
  font-size:1rem;
  font-weight:700;
  color:#111827;
  flex:1;
  line-height:1.2;
`

const CloseBtn = styled.button`
  background:none;
  border:none;
  cursor:pointer;
  width:36px; height:36px;
  border-radius:8px;
  display:inline-flex; align-items:center; justify-content:center;
  color: var(--primary-color);
  transition: background .15s;
  &:hover { background: var(--secondary-light); }
`

const Body = styled.div`
  padding: 1rem 1.25rem 1.25rem;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
  font-size:0.875rem;
  line-height:1.35;
  display:flex;
  flex-direction:column;
  gap:1rem;
`

export const ModalFooter = styled.div`
  margin-top: .5rem;
  padding: 0.75rem 1.25rem 1.25rem;
  display:flex;
  flex-wrap:wrap;
  gap:.65rem;
  justify-content:flex-end;
  background: linear-gradient(0deg,#fff, #fafafa);
  border-top:1px solid #f1f5f9;
`

export const ModalAction = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  appearance:none;
  border:none;
  cursor:pointer;
  font-weight:600;
  font-size:0.8rem;
  letter-spacing:.3px;
  padding:0.65rem 1.1rem;
  border-radius:10px;
  display:inline-flex; align-items:center; justify-content:center;
  gap:.4rem;
  background:${p=> p.$variant==='secondary' ? 'var(--secondary-light)' : 'linear-gradient(90deg,var(--primary-color),var(--secondary-color))'};
  color:${p=> p.$variant==='secondary' ? 'var(--secondary-color)' : '#fff'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: background .15s, transform .15s, box-shadow .15s;
  &:hover:not(:disabled){
    background:${p=> p.$variant==='secondary' ? 'var(--secondary-color)' : 'var(--primary-hover)'};
    color:#fff;
  }
  &:disabled { opacity:.55; cursor:not-allowed; }
  &:active:not(:disabled){ transform:translateY(1px); }
  &:focus-visible { outline:none; box-shadow: var(--focus-mix); }
`

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if(e.key==='Escape' && open) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <Backdrop $open={open} onMouseDown={e=> { if(e.target===e.currentTarget) onClose() }} aria-hidden={!open}>
      <Dialog $open={open} role="dialog" aria-modal="true" aria-labelledby={title? 'modal-title': undefined} $width={width}>
        <Header>
          {title && <Title id="modal-title">{title}</Title>}
          <CloseBtn type="button" aria-label="Fechar" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </CloseBtn>
        </Header>
        <Body>{children}</Body>
      </Dialog>
    </Backdrop>
  )
}

export default Modal