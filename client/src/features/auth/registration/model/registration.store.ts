import { create } from 'zustand'

import type { RegistrationChallenge } from '@/entities/session'

export const OTP_LENGTH = 4

export type RegistrationStep = 'credentials' | 'code'

type RegistrationState = {
  step: RegistrationStep
  registrationId: string | null
  /** Телефон, нормализованный сервером. */
  phone: string
  code: string
  codeExpiresAt: number | null
  resendAvailableAt: number | null
  /** Приходит только с dev-сервера, чтобы не ждать СМС. */
  devCode: string | null

  goToCodeStep: (challenge: RegistrationChallenge) => void
  setCode: (code: string) => void
  reset: () => void
}

const initialState = {
  step: 'credentials' as RegistrationStep,
  registrationId: null,
  phone: '',
  code: '',
  codeExpiresAt: null,
  resendAvailableAt: null,
  devCode: null,
}

export const useRegistrationStore = create<RegistrationState>()((set) => ({
  ...initialState,

  goToCodeStep: (challenge) =>
    set({
      step: 'code',
      registrationId: challenge.registrationId,
      phone: challenge.phone,
      code: '',
      codeExpiresAt: Date.now() + challenge.expiresIn * 1000,
      resendAvailableAt: Date.now() + challenge.resendAfter * 1000,
      devCode: challenge.devCode ?? null,
    }),

  setCode: (code) => set({ code }),

  reset: () => set(initialState),
}))
