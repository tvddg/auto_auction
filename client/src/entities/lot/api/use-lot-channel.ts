import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { cable } from '@/shared/api'

import { lotKeys } from './lot.queries'

type LotChannelEvent = { type: 'bid_placed'; lotId: string }

export const useLotChannel = (lotId: string) => {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!lotId) return
        let isFirstConnection = true

        const subscription = cable.subscriptions.create(
            // nonce added so that in StrictMode old subscription won't kill fresh
            { channel: 'LotChannel', lot_id: lotId, nonce: crypto.randomUUID() },
            {
                connected() {
                    if (isFirstConnection) {
                        isFirstConnection = false
                        return
                    }
                    queryClient.invalidateQueries({ queryKey: lotKeys.root })
                },
                received(event: LotChannelEvent) {
                    switch (event.type) {
                        case "bid_placed":
                            queryClient.invalidateQueries({ queryKey: lotKeys.detail(event.lotId) })
                            break
                        default:
                            break
                    }
                }
            },
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [lotId, queryClient])
}
