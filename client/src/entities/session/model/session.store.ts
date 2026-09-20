import { create } from 'zustand'

import { authToken } from '@/shared/api'

import type { SessionStatus, User } from './types'

type SessionState = {
  user: User | null
  status: SessionStatus
  signIn: (params: { accessToken: string; user: User }) => void
  setUser: (user: User) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  status: authToken.get() ? 'authenticated' : 'anonymous',

  signIn: ({ accessToken, user }) => {
    authToken.set(accessToken)
    set({ user, status: 'authenticated' })
  },

  setUser: (user) => set({ user }),

  reset: () => {
    authToken.clear()
    set({ user: null, status: 'anonymous' })
  },
}))

export const selectIsAuthenticated = (state: SessionState): boolean => state.status === 'authenticated'
export const selectUser = (state: SessionState): User | null => state.user

export const useIsAuthenticated = () => useSessionStore(selectIsAuthenticated)
export const useSessionUser = () => useSessionStore(selectUser)
