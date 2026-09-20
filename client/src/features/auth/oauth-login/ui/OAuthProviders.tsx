import { useState } from 'react'

import { cn } from '@/shared/lib'
import { Button, Icon } from '@/shared/ui'

import { oauthProviders, type OAuthProvider } from '../model/providers'

import styles from './OAuthProviders.module.css'

export const OAuthProviders = ({ className }: { className?: string }) => {
  const [notice, setNotice] = useState<string | null>(null)

  const handleClick = (provider: OAuthProvider) => {
    if (provider.href === null) {
      setNotice(`Вход через «${provider.label}» скоро появится`)
      return
    }

    window.location.assign(provider.href)
  }

  return (
    <div className={cn(styles.root, className)}>
      {oauthProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          className={styles.provider}
          onClick={() => handleClick(provider)}
          iconLeft={<Icon name={provider.icon} size={20} />}
        >
          {provider.label}
        </Button>
      ))}

      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
