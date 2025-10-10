import React, { useState } from 'react'
import styled from 'styled-components'
import { EyeIcon, EyeOffIcon } from '../Icons'

export type CoolInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

const StyledWrapper = styled.div`
  .coolinput {
    display: flex;
    flex-direction: column;
    width: 100%;
    position: static;
  }

  .coolinput label.text {
    font-size: 0.75rem;
    color: var(--primary-color);
    font-weight: 700;
    position: relative;
    top: 0.5rem;
    margin: 0 0 0 7px;
    padding: 0 3px;
    background: #ffffff;
    width: fit-content;
    z-index: 3; /* garante que fique acima do input */
    display: inline-block;
  }

  .coolinput input.input {
    padding: 11px 10px;
    font-size: 0.75rem;
    border: 2px var(--primary-color) solid;
    border-radius: 5px;
    background: #ffffff;
    width: 100%;
  }

  .coolinput input.input:focus {
    outline: none;
    box-shadow: var(--focus-mix);
  }

  .password-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-container input.input {
    padding-right: 3rem;
  }

  .toggle {
    position: absolute;
    right: 0.5rem;
    top: 0;
    bottom: 0;
    transform: none;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
    z-index: 2;
  }

  .toggle:hover {
    color: var(--primary-color);
    background-color: var(--secondary-light);
  }
`

export const CoolInput: React.FC<CoolInputProps> = ({ label, id, name, ...rest }) => {
  const htmlFor = id || name || undefined
  return (
    <StyledWrapper>
      <div className="coolinput">
        <label htmlFor={htmlFor} className="text">{label}</label>
        <input id={id} name={name} className="input" {...rest} />
      </div>
    </StyledWrapper>
  )
}

export const PasswordInput: React.FC<CoolInputProps> = ({ label, id, name, ...rest }) => {
  const [visible, setVisible] = useState(false)
  const htmlFor = id || name || undefined
  return (
    <StyledWrapper>
      <div className="coolinput password-wrapper">
        <label htmlFor={htmlFor} className="text">{label}</label>
        <div className="input-container">
          <input
            id={id}
            name={name}
            className="input"
            type={visible ? 'text' : 'password'}
            {...rest}
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
    </StyledWrapper>
  )
}
