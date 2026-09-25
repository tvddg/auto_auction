import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from './query-client'
import { SessionProvider } from './SessionProvider'

export const AppProviders = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
        <SessionProvider>
            {children}
        </SessionProvider>
    </QueryClientProvider>
)
