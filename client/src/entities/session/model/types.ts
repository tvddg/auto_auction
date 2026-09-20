
export type UserRole = 'private' | 'dealer' | 'corporate'

export type User = {
  id: string
  phone: string
  name: string | null
  role: UserRole
  phoneVerified: boolean
  createdAt: string
}

export type AuthIntent = 'login' | 'register'

export type OtpChallenge = {
  expiresIn: number
  resendAfter: number
  devCode?: string
}

export type AuthResult = {
  accessToken: string
  expiresIn: number
  user: User
}

export type SessionStatus = 'anonymous' | 'authenticated'
