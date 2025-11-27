import React from 'react'
import type { ReactNode } from 'react'
import styled from 'styled-components'

interface FancyCardProps {
  title: string
  body?: string
  children?: ReactNode
  width?: string | number
  height?: string | number
  gradient?: string
  color?: string
  onClick?: () => void
  role?: string
  tabIndex?: number
}

const StyledWrapper = styled.div<{
  $w?: string | number; $h?: string | number; $gradient?: string; $color?: string; $clickable?: boolean;
}>`
  .notification {
    display: flex;
    flex-direction: column;
    isolation: isolate;
    position: relative;
    width: ${({ $w }) => typeof $w === 'number' ? $w + 'px' : ($w || '18rem')};
    height: ${({ $h }) => typeof $h === 'number' ? $h + 'px' : ($h || '8rem')};
    background: #ffffff; /* fundo claro */
    border: 1px solid #e5e7eb; /* sutileza no tema claro */
    border-radius: 1rem;
    overflow: hidden;
    font-size: 16px;
    --gradient: ${({ $gradient }) => $gradient || 'var(--primary-color)'}; /* barra única na secondary */
    --color: ${({ $color }) => $color || 'var(--secondary-color)'}; /* título na secondary */
    cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
    transition: box-shadow 300ms ease, transform 300ms ease;
    color: #111827;
  }
  .notification:before {
    position: absolute;
    content: '';
    inset: 0.0625rem;
    border-radius: 0.9375rem;
    background: #ffffff; /* camada interna clara */
    z-index: 2;
  }
  .notification:after {
    position: absolute;
    content: '';
    width: 0.25rem;
    inset: 0.65rem auto 0.65rem 0.5rem;
    border-radius: 0.125rem;
    background: var(--gradient); /* barra lateral em secondary */
    transition: transform 300ms ease;
    z-index: 4;
  }
  .notification:hover:after { transform: translateX(0.15rem); }
  .notification:hover { box-shadow: 0 10px 24px rgba(0,0,0,.12); transform: translateY(-2px); }
  .notititle {
    color: var(--color);
    padding: 0.65rem 0.25rem 0.4rem 1.25rem;
    font-weight: 600;
    font-size: 1.05rem;
    transition: transform 300ms ease;
    z-index: 5;
    margin: 0;
    line-height: 1.15;
  }
  .notification:hover .notititle { transform: translateX(0.15rem); }
  .notibody {
    color: #374151; /* texto secundário escuro no claro */
    padding: 0 1.25rem 0.85rem;
    transition: transform 300ms ease;
    z-index: 5;
    font-size: 0.78rem;
    line-height: 1.25;
    flex: 1;
    display: flex;
    align-items: flex-start;
  }
  .notification:hover .notibody { transform: translateX(0.25rem); }
  .notiglow, .notiborderglow {
    position: absolute;
    width: 20rem; height: 20rem;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle closest-side at center, white, transparent);
    opacity: 0;
    transition: opacity 300ms ease;
    pointer-events: none;
  }
  .notiglow { z-index: 3; }
  .notiborderglow { z-index: 1; }
  .notification:hover .notiglow { opacity: 0.06; }
  .notification:hover .notiborderglow { opacity: 0.06; }
  @media (prefers-reduced-motion: reduce) {
    .notification, .notification:after, .notititle, .notibody { transition: none; }
  }
`

export const FancyCard: React.FC<FancyCardProps> = ({ title, body, children, width, height, gradient, color, onClick, role, tabIndex }) => (
  <StyledWrapper $w={width} $h={height} $gradient={gradient} $color={color} $clickable={!!onClick}>
    <div
      className="notification"
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={(e) => { if(onClick && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); onClick(); } }}
    >
      <div className="notiglow" />
      <div className="notiborderglow" />
      <h4 className="notititle" title={title}>{title}</h4>
      {children ? (
        <div className="notibody" role="group">{children}</div>
      ) : (
        body && <div className="notibody">{body}</div>
      )}
    </div>
  </StyledWrapper>
)

export default FancyCard
