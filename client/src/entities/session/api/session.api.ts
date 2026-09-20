import { apiEndpoints, apiRequest } from '@/shared/api'

import type { AuthResult, RegistrationChallenge, User } from '../model/types'

export type LoginDto = {
  email: string
  password: string
}

export type StartRegistrationDto = {
  email: string
  password: string
  /** Телефон в формате E.164: +79260000000. */
  phone: string
}

export type ConfirmRegistrationDto = {
  registrationId: string
  code: string
}

export const login = (dto: LoginDto, signal?: AbortSignal) =>
  apiRequest<AuthResult>(apiEndpoints.auth.login, {
    method: 'POST',
    body: dto,
    withAuth: false,
    signal,
  })

export const startRegistration = (dto: StartRegistrationDto, signal?: AbortSignal) =>
  apiRequest<RegistrationChallenge>(apiEndpoints.auth.registration, {
    method: 'POST',
    body: dto,
    withAuth: false,
    signal,
  })

export const resendRegistrationCode = (registrationId: string, signal?: AbortSignal) =>
  apiRequest<RegistrationChallenge>(apiEndpoints.auth.registrationResend, {
    method: 'POST',
    body: { registrationId },
    withAuth: false,
    signal,
  })

export const confirmRegistration = (dto: ConfirmRegistrationDto, signal?: AbortSignal) =>
  apiRequest<AuthResult>(apiEndpoints.auth.registrationConfirm, {
    method: 'POST',
    body: dto,
    withAuth: false,
    signal,
  })

export const fetchCurrentUser = (signal?: AbortSignal) =>
  apiRequest<User>(apiEndpoints.auth.me, { signal })

export const logout = () => apiRequest<void>(apiEndpoints.auth.logout, { method: 'POST' })
