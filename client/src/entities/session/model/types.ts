export type User = {
  id: string
  email: string
  phone: string
  name: string | null
  phoneVerified: boolean
  createdAt: string
}

export type AuthResult = {
  accessToken: string
  expiresIn: number
  user: User
}

/** Ответ на шаг 1 регистрации: аккаунта ещё нет, есть заявка и высланный код. */
export type RegistrationChallenge = {
  registrationId: string
  /** Номер в формате E.164, нормализованный сервером. */
  phone: string
  /** Сколько секунд живёт код. */
  expiresIn: number
  /** Через сколько секунд можно запросить код повторно. */
  resendAfter: number
  /** Приходит только с dev-сервера. */
  devCode?: string
}

export type SessionStatus = 'anonymous' | 'authenticated'
