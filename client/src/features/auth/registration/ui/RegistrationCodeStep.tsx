import { useId, type SubmitEvent } from 'react'

import { getFieldError, getFormError } from '@/shared/api'
import { cn, formatDuration, formatPhone, normalizePhoneDigits, useCountdown } from '@/shared/lib'
import { Button, FormError, FormField, Icon, isOtpFilled, OtpInput } from '@/shared/ui'

import { useConfirmRegistration } from '../api/use-confirm-registration'
import { useResendCode } from '../api/use-resend-code'
import { OTP_LENGTH, useRegistrationStore } from '../model/registration.store'

import styles from './RegistrationCodeStep.module.css'

/** Шаг 2 регистрации: код из СМС. Аккаунт создаётся, когда код сойдётся. */
export const RegistrationCodeStep = ({ className }: { className?: string }) => {
  const codeFieldId = useId()

  const registrationId = useRegistrationStore((state) => state.registrationId)
  const phone = useRegistrationStore((state) => state.phone)
  const code = useRegistrationStore((state) => state.code)
  const codeExpiresAt = useRegistrationStore((state) => state.codeExpiresAt)
  const resendAvailableAt = useRegistrationStore((state) => state.resendAvailableAt)
  const devCode = useRegistrationStore((state) => state.devCode)
  const setCode = useRegistrationStore((state) => state.setCode)
  const backToCredentials = useRegistrationStore((state) => state.backToCredentials)

  const confirmRegistration = useConfirmRegistration()
  const resendCode = useResendCode()

  const secondsLeft = useCountdown(codeExpiresAt)
  const secondsUntilResend = useCountdown(resendAvailableAt)
  const isCodeAlive = secondsLeft > 0

  const error = confirmRegistration.error ?? resendCode.error
  const codeError = getFieldError(error, 'code')
  const formError = getFormError(error)

  const isCodeReady = isOtpFilled(code, OTP_LENGTH)

  const submitCode = (value: string) => {
    if (registrationId === null || confirmRegistration.isPending) return

    confirmRegistration.mutate({ registrationId, code: value })
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isCodeReady) submitCode(code)
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (confirmRegistration.error) confirmRegistration.reset()
    // Код короткий — как только он собран, отправляем сами
    if (isOtpFilled(value, OTP_LENGTH)) submitCode(value)
  }

  const handleResend = () => {
    if (registrationId === null || resendCode.isPending) return

    confirmRegistration.reset()
    resendCode.mutate(registrationId)
  }

  return (
    <form className={cn(styles.step, className)} onSubmit={handleSubmit} noValidate>
      <Button className={styles.back} variant="ghost" onClick={backToCredentials}>
        ← Назад
      </Button>

      <p className={styles.sentTo}>
        Код отправлен на <span className={styles.phone}>{formatPhone(normalizePhoneDigits(phone))}</span>
      </p>

      <FormError message={formError} />

      <FormField
        label="Код из СМС"
        htmlFor={codeFieldId}
        error={codeError}
        aside={
          isCodeAlive ? (
            <span className={styles.timer}>
              <Icon name="grayClock" size={14} />
              <time>{formatDuration(secondsLeft)}</time>
            </span>
          ) : secondsUntilResend > 0 ? (
            <span className={styles.timer}>Повтор через {formatDuration(secondsUntilResend)}</span>
          ) : (
            <Button
              className={styles.resend}
              variant="ghost"
              onClick={handleResend}
              loading={resendCode.isPending}
            >
              Выслать повторно
            </Button>
          )
        }
      >
        <OtpInput
          id={codeFieldId}
          value={code}
          onChange={handleCodeChange}
          length={OTP_LENGTH}
          disabled={!isCodeAlive || confirmRegistration.isPending}
          invalid={Boolean(codeError)}
          autoFocus
          aria-label={`Код из СМС, ${OTP_LENGTH} цифры`}
        />
      </FormField>

      {devCode ? <p className={styles.devHint}>Код для разработки: {devCode}</p> : null}

      <Button
        type="submit"
        fullWidth
        loading={confirmRegistration.isPending}
        disabled={!isCodeReady || !isCodeAlive}
        trailing="→"
      >
        Подтвердить
      </Button>
    </form>
  )
}
