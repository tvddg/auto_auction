import type { IconName } from '@/shared/ui'

export type OAuthProviderId = 'gosuslugi' | 'mail'

export type OAuthProvider = {
  id: OAuthProviderId
  label: string
  icon: IconName
  href: string | null
}

export const oauthProviders: readonly OAuthProvider[] = [
  { id: 'gosuslugi', label: 'Госуслуги', icon: 'gosuslugi', href: null },
  { id: 'mail', label: 'Почта', icon: 'mail', href: null },
]
