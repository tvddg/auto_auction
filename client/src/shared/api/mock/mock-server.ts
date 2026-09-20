import { env } from '@/shared/config'

import { apiEndpoints } from '../endpoints'

const CODE_TTL_SECONDS = 60
const RESEND_AFTER_SECONDS = 60
const LATENCY_MS = 500

type Challenge = { code: string; expiresAt: number }

const challenges = new Map<string, Challenge>()
let issuedToken: string | null = null
let currentPhone: string | null = null

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fail = (status: number, code: string, message: string, details?: Record<string, string[]>) =>
  json(status, { error: { code, message, details } })

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000))

const mockUser = (phone: string) => ({
  id: 'usr_1',
  phone,
  name: null,
  role: 'private',
  phoneVerified: true,
  createdAt: new Date().toISOString(),
})

const handlers: Record<string, (body: Record<string, unknown>, init: RequestInit) => Response> = {
  [`POST ${apiEndpoints.auth.requestOtp}`]: (body) => {
    const phone = String(body.phone ?? '')
    if (phone.replace(/\D/g, '').length !== 11) {
      return fail(422, 'validation_error', 'Проверьте номер телефона', {
        phone: ['Введите номер полностью'],
      })
    }

    const code = randomCode()
    challenges.set(phone, { code, expiresAt: Date.now() + CODE_TTL_SECONDS * 1000 })
    currentPhone = phone
    // eslint-disable-next-line no-console -- код «из СМС» для локальной разработки
    console.info(`[mock api] код подтверждения для ${phone}: ${code}`)

    return json(200, {
      expiresIn: CODE_TTL_SECONDS,
      resendAfter: RESEND_AFTER_SECONDS,
      devCode: code,
    })
  },

  [`POST ${apiEndpoints.auth.verifyOtp}`]: (body) => {
    const phone = String(body.phone ?? '')
    const code = String(body.code ?? '')
    const challenge = challenges.get(phone)

    if (!challenge) return fail(422, 'code_expired', 'Запросите код заново')
    if (challenge.expiresAt < Date.now()) {
      challenges.delete(phone)
      return fail(422, 'code_expired', 'Срок действия кода истёк. Запросите новый')
    }
    if (challenge.code !== code) return fail(422, 'invalid_code', 'Неверный код из СМС')

    challenges.delete(phone)
    issuedToken = `mock.access.${Date.now()}`
    currentPhone = phone

    return json(200, { accessToken: issuedToken, expiresIn: 900, user: mockUser(phone) })
  },

  [`POST ${apiEndpoints.auth.refresh}`]: () => {
    if (!issuedToken) return fail(401, 'unauthorized', 'Сессия не найдена')
    issuedToken = `mock.access.${Date.now()}`
    return json(200, { accessToken: issuedToken, expiresIn: 900 })
  },

  [`POST ${apiEndpoints.auth.logout}`]: () => {
    issuedToken = null
    currentPhone = null
    return new Response(null, { status: 204 })
  },

  [`GET ${apiEndpoints.auth.me}`]: (_body, init) => {
    const headers = new Headers(init.headers)
    const authorized = issuedToken !== null && headers.get('Authorization') === `Bearer ${issuedToken}`
    if (!authorized || !currentPhone) return fail(401, 'unauthorized', 'Требуется авторизация')
    return json(200, mockUser(currentPhone))
  },
}

export const mockFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  await delay(LATENCY_MS)

  const path = url.startsWith(env.apiBaseUrl) ? url.slice(env.apiBaseUrl.length) : url
  const method = (init.method ?? 'GET').toUpperCase()
  const handler = handlers[`${method} ${path}`]

  if (!handler) return fail(404, 'not_found', `Мок-сервер не знает про ${method} ${path}`)

  const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {}
  return handler(body, init)
}
