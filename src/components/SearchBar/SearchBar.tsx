import styled from 'styled-components'
import { IoMdSearch } from 'react-icons/io'

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
  padding: clamp(0.75rem, 2.5vw, 1rem) 3.5rem clamp(0.75rem, 2.5vw, 1rem) 1rem;
  border: 2px solid var(--primary-color);
  border-radius: 9999px;
  background: #ffffff;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  transition:
    box-shadow 0.15s ease-in-out,
    border-color 0.15s ease-in-out;
  box-sizing: border-box;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  &::placeholder {
    color: #9ca3af;
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
    width: clamp(1.35rem, 3vw, 1.75rem);
    height: clamp(1.35rem, 3vw, 1.75rem);
  }
`

const SearchBar = () => (
  <Wrapper>
    <Bar>
      <Input type="text" placeholder="Buscar..." aria-label="Buscar" />
      <Icon aria-hidden="true">
        <IoMdSearch />
      </Icon>
    </Bar>
  </Wrapper>
)

export default SearchBar
