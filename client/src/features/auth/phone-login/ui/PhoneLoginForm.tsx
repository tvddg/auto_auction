import { useEffect, useId, type SubmitEvent } from 'react'

import { env } from '@/shared/config'
import { getErrorMessage, isApiError } from '@/shared/api'
import {
  cn,
  formatDuration,
  formatPhone,
  isPhoneComplete,
  PHONE_PLACEHOLDER,
  toE164,
  useCountdown,
} from '@/shared/lib'
import { Button, FormField, Icon, isOtpFilled, OtpInput, TextInput } from '@/shared/ui'

import { useRequestOtp } from '../api/use-request-otp'
import { useVerifyOtp } from '../api/use-verify-otp'
import { OTP_LENGTH, usePhoneLoginStore } from '../model/phone-login.store'

import styles from './PhoneLoginForm.module.css'

const fieldError = (error: unknown, field: string): string | null => {
  if (!isApiError(error)) return error ? getErrorMessage(error) : null
  return error.details?.[field]?.[0] ?? error.message
}

export const PhoneLoginForm = ({ className }: { className?: string }) => {
  const phoneFieldId = useId()
  const codeFieldId = useId()

  const intent = usePhoneLoginStore((state) => state.intent)
  const phone = usePhoneLoginStore((state) => state.phone)
  const code = usePhoneLoginStore((state) => state.code)
  const codeRequested = usePhoneLoginStore((state) => state.codeRequested)
  const codeExpiresAt = usePhoneLoginStore((state) => state.codeExpiresAt)
  const devCode = usePhoneLoginStore((state) => state.devCode)
  const setPhone = usePhoneLoginStore((state) => state.setPhone)
  const setCode = usePhoneLoginStore((state) => state.setCode)

  const requestOtpMutation = useRequestOtp()
  const verifyOtpMutation = useVerifyOtp()

  const secondsLeft = useCountdown(codeExpiresAt)
  const isCodeActive = codeRequested && secondsLeft > 0
  const isCodeExpired = codeRequested && secondsLeft === 0

  const isPhoneReady = isPhoneComplete(phone)
  const isCodeReady = isOtpFilled(code, OTP_LENGTH)

  const requestCode = () => {
    if (!isPhoneReady || requestOtpMutation.isPending) return
    verifyOtpMutation.reset()
    requestOtpMutation.mutate({ phone: toE164(phone), intent })
  }

  const submitCode = (value: string) => {
    if (verifyOtpMutation.isPending) return
    verifyOtpMutation.mutate({ phone: toE164(phone), intent, code: value })
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isCodeActive) requestCode()
    else if (isCodeReady) submitCode(code)
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (verifyOtpMutation.error) verifyOtpMutation.reset()
    if (isOtpFilled(value, OTP_LENGTH)) submitCode(value)
  }

  useEffect(() => {
    if (!codeRequested) return
    document.getElementById(codeFieldId)?.focus()
  }, [codeRequested, codeFieldId])

  const phoneError = fieldError(requestOtpMutation.error, 'phone')
  const codeError = fieldError(verifyOtpMutation.error, 'code')

  const submitLabel = !isCodeActive ? 'Получить код' : intent === 'login' ? 'Войти' : 'Зарегистрироваться'

  return (
    <form className={cn(styles.form, className)} onSubmit={handleSubmit} noValidate>
      <FormField label="Телефон" htmlFor={phoneFieldId} error={phoneError}>
        <TextInput
          id={phoneFieldId}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={PHONE_PLACEHOLDER}
          value={formatPhone(phone)}
          onChange={(event) => setPhone(event.target.value)}
          invalid={Boolean(phoneError)}
          iconLeft={<Icon name="phone" size={22} />}
        />
      </FormField>

      <FormField
        label="Код из СМС"
        htmlFor={codeFieldId}
        error={codeError}
        aside={
          isCodeActive ? (
            <span className={styles.timer}>
              <Icon name="grayClock" size={18} />
              <time>{formatDuration(secondsLeft)}</time>
            </span>
          ) : isCodeExpired ? (
            <Button
              className={styles.resend}
              variant="ghost"
              onClick={requestCode}
              loading={requestOtpMutation.isPending}
            >
              Выслать повторно
            </Button>
          ) : null
        }
      >
        <OtpInput
          id={codeFieldId}
          value={code}
          onChange={handleCodeChange}
          length={OTP_LENGTH}
          disabled={!isCodeActive || verifyOtpMutation.isPending}
          invalid={Boolean(codeError)}
          aria-label={`Код из СМС, ${OTP_LENGTH} цифры`}
        />
      </FormField>

      {!codeRequested ? (
        <p className={styles.hint}>Отправим короткий код в СМС — пароль не нужен.</p>
      ) : null}

      {env.enableApiMock && devCode ? (
        <p className={cn(styles.hint, styles.devHint)}>Код для разработки: {devCode}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={requestOtpMutation.isPending || verifyOtpMutation.isPending}
        disabled={isCodeActive ? !isCodeReady : !isPhoneReady}
        trailing="→"
      >
        {submitLabel}
      </Button>
    </form>
  )
}
