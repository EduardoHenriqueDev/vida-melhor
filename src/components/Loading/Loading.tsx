import styled, { keyframes } from 'styled-components'

type LoadingProps = {
  message?: string
  fullPage?: boolean
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Wrapper = styled.div<{ $full: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  min-height: ${({ $full }) => ($full ? '50vh' : 'auto')};
`

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid var(--secondary-light);
  border-top-color: var(--primary-color);
  border-right-color: var(--secondary-color);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`

const Text = styled.span`
  color: #6b7280;
  font-weight: 600;
`

const Loading = ({ message = 'Carregando...', fullPage = false }: LoadingProps) => (
  <Wrapper $full={fullPage} role="status" aria-live="polite">
    <Spinner />
    <Text>{message}</Text>
  </Wrapper>
)

export default Loading
