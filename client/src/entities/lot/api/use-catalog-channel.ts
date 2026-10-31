import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useEffect } from 'react'

import { cable } from '@/shared/api'

import type { LotListPage } from '../model/types'

import { lotKeys } from './lot.queries'

type CatalogChannelEvent = { type: 'bid_placed'; lotId: string }

export const useCatalogChannel = () => {
    const queryClient = useQueryClient()

    useEffect(() => {
        let isFirstConnection = true;
        const subscription = cable.subscriptions.create(
            // nonce added so that in StrictMode old subscription won't kill fresh
            { channel: 'CatalogChannel', nonce: crypto.randomUUID() },
            {
                connected() {
                    if (isFirstConnection) {
                        isFirstConnection = false
                        return
                    }
                    queryClient.invalidateQueries({ queryKey: [...lotKeys.root, 'list'] })
                }, 
                received(event: CatalogChannelEvent) {
                    switch (event.type) {
                        case "bid_placed": {
                            const data = queryClient.getQueriesData<InfiniteData<LotListPage>>
                                ({ queryKey: [...lotKeys.root, 'list'] })
                            const pairsToRevalidate = data.filter(pair => pair[1]?.pages
                                .some(page => page.items.some(lot => lot.id === event.lotId)))
                            pairsToRevalidate.forEach(pair => {
                                queryClient.invalidateQueries({ queryKey: pair[0], exact: true })
                            })
                            break
                        }
                        default:
                            break
                    }
                }
            },
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [queryClient])
}
