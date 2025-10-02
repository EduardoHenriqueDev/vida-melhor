import styled from 'styled-components'
import { IoBagHandleOutline } from 'react-icons/io5'

interface CartIconProps {
  onClick?: () => void
  count?: number
}

const Button = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  padding: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  @media (min-width: 768px) {
    svg {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
`

const Badge = styled.span`
  position: absolute;
  bottom: -2px;
  right: -2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  border: 2px solid #fff; /* ring para destacar sobre o ícone */
  pointer-events: none; /* não bloqueia clique no botão */
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);

  @media (min-width: 768px) {
    min-width: 1.2rem;
    height: 1.2rem;
    font-size: 0.7rem;
  }
`

const CartIcon = ({ onClick, count = 0 }: CartIconProps) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <Button type="button" aria-label="Abrir carrinho" onClick={onClick}>
      <IoBagHandleOutline />
    </Button>
    {count > 0 && <Badge aria-hidden="true">{count}</Badge>}
  </div>
)

export default CartIcon
