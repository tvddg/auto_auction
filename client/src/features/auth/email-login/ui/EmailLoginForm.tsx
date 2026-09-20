import { useId, useState, type SubmitEvent } from 'react'

import { getFieldError, getFormError } from '@/shared/api'
import { cn, isEmailValid } from '@/shared/lib'
import { Button, FormError, FormField, Icon, PasswordInput, TextInput } from '@/shared/ui'

import { useLogin } from '../api/use-login'

import styles from './EmailLoginForm.module.css'

export const EmailLoginForm = ({ className }: { className?: string }) => {
  const emailFieldId = useId()
  const passwordFieldId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loginMutation = useLogin()
  const { error } = loginMutation

  const emailError = getFieldError(error, 'email')
  const passwordError = getFieldError(error, 'password')
  const formError = getFormError(error)

  const isReady = isEmailValid(email) && password.length > 0

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isReady || loginMutation.isPending) return

    loginMutation.mutate({ email: email.trim(), password })
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
          autoComplete="current-password"
          placeholder="Ваш пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(passwordError)}
          iconLeft={<Icon name="guard" size={18} />}
        />
      </FormField>

      <Button type="submit" fullWidth loading={loginMutation.isPending} disabled={!isReady} trailing="→">
        Войти
      </Button>
    </form>
  )
}
