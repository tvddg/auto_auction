import { useEffect } from 'react'

import { lotKeys, type LotDetail } from '@/entities/lot'
import { formatRubles, useCountdown } from '@/shared/lib'
import { useQueryClient } from '@tanstack/react-query'

import { formatBidCount, formatCountdown, formatDateTime } from '../lib/format'
import styles from './LotPage.module.css'

/** Текущая цена и время: до конца торгов, до старта или дата завершения. */
export const LotPriceBlock = ({ lot }: { lot: LotDetail }) => {
  const queryClient = useQueryClient()
  const deadline = lot.status === 'active' ? lot.endsAt : lot.status === 'upcoming' ? lot.startsAt : null
  const secondsLeft = useCountdown(deadline ? new Date(deadline).getTime() : null)

  // Таймер дошёл до нуля — фаза лота сменилась (старт или конец торгов), перезапрашиваем
  useEffect(() => {
    if (deadline && secondsLeft === 0) void queryClient.invalidateQueries({ queryKey: lotKeys.detail(lot.id) })
  }, [deadline, secondsLeft, queryClient, lot.id])

  const priceLabel = lot.bidCount === 0 ? 'Стартовая цена' : lot.status === 'sold' ? 'Итоговая цена' : 'Текущая цена'

  return (
    <div className={styles.priceBlock}>
      <div className={styles.priceCell}>
        <span className={styles.caption}>{priceLabel}</span>
        <span className={styles.priceValue}>{formatRubles(lot.currentPrice)}</span>
      </div>
      <div className={styles.priceCell}>
        {deadline ? (
          <>
            <span className={styles.caption}>{lot.status === 'active' ? 'До конца' : 'До старта'}</span>
            <span className={styles.timer}>{formatCountdown(secondsLeft)}</span>
          </>
        ) : (
          <>
            <span className={styles.caption}>Торги завершены</span>
            <span className={styles.finishedAt}>{formatDateTime(lot.endsAt)}</span>
          </>
        )}
        <span className={styles.meta}>{formatBidCount(lot.bidCount)}</span>
      </div>
    </div>
  )
}
