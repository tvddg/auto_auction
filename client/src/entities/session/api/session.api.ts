import { apiEndpoints, apiRequest } from '@/shared/api'

import type { AuthIntent, AuthResult, OtpChallenge, User } from '../model/types'

export type RequestOtpDto = {
  phone: string
  intent: AuthIntent
}

export type VerifyOtpDto = RequestOtpDto & {
  code: string
}

export const requestOtp = (dto: RequestOtpDto, signal?: AbortSignal) =>
  apiRequest<OtpChallenge>(apiEndpoints.auth.requestOtp, {
    method: 'POST',
    body: dto,
    withAuth: false,
    signal,
  })

export const verifyOtp = (dto: VerifyOtpDto, signal?: AbortSignal) =>
  apiRequest<AuthResult>(apiEndpoints.auth.verifyOtp, {
    method: 'POST',
    body: dto,
    withAuth: false,
    signal,
  })

export const fetchCurrentUser = (signal?: AbortSignal) =>
  apiRequest<User>(apiEndpoints.auth.me, { signal })

export const logout = () => apiRequest<void>(apiEndpoints.auth.logout, { method: 'POST' })
