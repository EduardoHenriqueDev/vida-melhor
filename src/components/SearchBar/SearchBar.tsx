import styled from 'styled-components'
import { IoMdSearch } from 'react-icons/io'
import type { FormEvent } from 'react'

const Wrapper = styled.div`
  width: calc(100% - 2rem);
  margin: 1rem auto;
  max-width: 1200px;
  box-sizing: border-box;
`

const Bar = styled.div`
  position: relative;
  width: 100%;
`

const Input = styled.input`
  width: 100%;
  padding: clamp(1rem, 3.5vw, 1.25rem) 3.5rem clamp(1rem, 3.5vw, 1.25rem) 1rem;
  border: 2px solid var(--primary-color);
  border-radius: 9999px;
  background: #ffffff;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  transition:
    box-shadow 0.15s ease-in-out,
    border-color 0.15s ease-in-out;
  box-sizing: border-box;

  &:focus { outline:none; box-shadow: var(--focus-mix); }

  &::placeholder {
    color: #9ca3af;
  }

  @media (min-width: 1024px) {
    padding: 0.65rem 2.5rem 0.65rem 0.9rem;
    font-size: 0.85rem;
  }
`

const Icon = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;

  svg {
    width: clamp(1.75rem, 3.5vw, 2.25rem);
    height: clamp(1.75rem, 3.5vw, 2.25rem);
  }

  @media (min-width: 1024px) {
    right: 0.6rem;

    svg {
      width: 1.4rem;
      height: 1.4rem;
    }
  }
`

interface SearchBarProps { value?: string; onChange?: (value: string) => void; onSubmit?: (value: string) => void }

const SearchBar = ({ value = '', onChange, onSubmit }: SearchBarProps) => {
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSubmit?.(value) }
  return (
    <Wrapper>
      <form onSubmit={handleSubmit} style={{ margin: 0 }}>
        <Bar>
          <Input
            type="text"
            placeholder="Buscar..."
            aria-label="Buscar"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <Icon aria-hidden="true">
            <IoMdSearch />
          </Icon>
        </Bar>
      </form>
    </Wrapper>
  )
}

export default SearchBar
