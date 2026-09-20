import { useState } from 'react'

import { TextInput, type TextInputProps } from '../text-input/TextInput'

import styles from './PasswordInput.module.css'

export type PasswordInputProps = Omit<TextInputProps, 'type' | 'slotRight'>

export const PasswordInput = (props: PasswordInputProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <TextInput
      {...props}
      type={visible ? 'text' : 'password'}
      slotRight={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {visible ? 'Скрыть' : 'Показать'}
        </button>
      }
    />
  )
}
