import { create } from 'zustand'

import type { AuthIntent, OtpChallenge } from '@/entities/session'
import { normalizePhoneDigits } from '@/shared/lib'

export const OTP_LENGTH = 4

type PhoneLoginState = {
  intent: AuthIntent
  phone: string
  code: string
  codeRequested: boolean
  codeExpiresAt: number | null
  resendAvailableAt: number | null
  devCode: string | null

  setIntent: (intent: AuthIntent) => void
  setPhone: (input: string) => void
  setCode: (code: string) => void
  startCodeStep: (challenge: OtpChallenge) => void
  reset: () => void
}

const initialState = {
  intent: 'login' as AuthIntent,
  phone: '',
  code: '',
  codeRequested: false,
  codeExpiresAt: null,
  resendAvailableAt: null,
  devCode: null,
}

export const usePhoneLoginStore = create<PhoneLoginState>()((set) => ({
  ...initialState,

  setIntent: (intent) => set({ ...initialState, intent }),

  setPhone: (input) =>
    set((state) => {
      const phone = normalizePhoneDigits(input)
      if (phone === state.phone) return state
      return { ...state, phone, code: '', codeRequested: false, codeExpiresAt: null, devCode: null }
    }),

  setCode: (code) => set({ code }),

  startCodeStep: (challenge) =>
    set({
      code: '',
      codeRequested: true,
      codeExpiresAt: Date.now() + challenge.expiresIn * 1000,
      resendAvailableAt: Date.now() + challenge.resendAfter * 1000,
      devCode: challenge.devCode ?? null,
    }),

  reset: () => set(initialState),
}))
