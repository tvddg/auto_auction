import { useId, useState, type SubmitEvent } from 'react'

import { getFieldError, getFormError } from '@/shared/api'
import {
  cn,
  formatPhone,
  isEmailValid,
  isPasswordValid,
  isPhoneComplete,
  MIN_PASSWORD_LENGTH,
  normalizePhoneDigits,
  PHONE_PLACEHOLDER,
  toE164,
} from '@/shared/lib'
import { Button, FormError, FormField, Icon, PasswordInput, TextInput } from '@/shared/ui'

import { useStartRegistration } from '../api/use-start-registration'

import styles from './RegistrationForm.module.css'

export const RegistrationForm = ({ className }: { className?: string }) => {
  const emailFieldId = useId()
  const passwordFieldId = useId()
  const phoneFieldId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const startRegistration = useStartRegistration()
  const { error } = startRegistration

  const emailError = getFieldError(error, 'email')
  const passwordError = getFieldError(error, 'password')
  const phoneError = getFieldError(error, 'phone')
  const formError = getFormError(error)

  const isReady = isEmailValid(email) && isPasswordValid(password) && isPhoneComplete(phone)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isReady || startRegistration.isPending) return

    startRegistration.mutate({ email: email.trim(), password, phone: toE164(phone) })
  }

  return (
    <form className={cn(styles.form, className)} onSubmit={handleSubmit} noValidate>
      <FormError message={formError} />

      <FormField label="Email" htmlFor={emailFieldId} error={emailError}>
        <TextInput
          id={emailFieldId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ivan@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          invalid={Boolean(emailError)}
          iconLeft={<Icon name="mail" size={18} />}
        />
      </FormField>

      <FormField label="Пароль" htmlFor={passwordFieldId} error={passwordError}>
        <PasswordInput
          id={passwordFieldId}
          name="password"
          autoComplete="new-password"
          placeholder={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(passwordError)}
          iconLeft={<Icon name="guard" size={18} />}
        />
      </FormField>

      <FormField label="Телефон" htmlFor={phoneFieldId} error={phoneError}>
        <TextInput
          id={phoneFieldId}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={PHONE_PLACEHOLDER}
          value={formatPhone(phone)}
          onChange={(event) => setPhone(normalizePhoneDigits(event.target.value))}
          invalid={Boolean(phoneError)}
          iconLeft={<Icon name="phone" size={18} />}
        />
      </FormField>

      <p className={styles.hint}>На этот номер придёт код — он подтвердит телефон.</p>

      <Button
        type="submit"
        fullWidth
        loading={startRegistration.isPending}
        disabled={!isReady}
        trailing="→"
      >
        Получить код
      </Button>
    </form>
  )
}
