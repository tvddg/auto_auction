import { useState } from 'react'

import { useLotBidsQuery, type LotDetail } from '@/entities/lot'
import { cn, formatRubles } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import { formatAgo } from '../lib/format'
import styles from './LotPage.module.css'

/** Сколько ставок видно до «Все N» */
const COLLAPSED_COUNT = 3

/** Лента ставок: новые сверху, свои — зелёным с пометкой «вы». */
export const BidFeedList = ({ lot }: { lot: LotDetail }) => {
  const [expanded, setExpanded] = useState(false)
  const feed = useLotBidsQuery(lot.id)

  const items = feed.data?.items ?? []
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT)

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Лента ставок</h2>
        {items.length > COLLAPSED_COUNT && (
          <button type="button" className={styles.sectionAction} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Свернуть' : `Все ${feed.data?.total ?? items.length}`}
          </button>
        )}
      </div>

      {feed.isPending ? (
        <p className={styles.muted}>Загружаем ставки…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>Ставок пока нет — ваша может стать первой</p>
      ) : (
        <ul className={styles.feed}>
          {visible.map((bid) => (
            <li key={bid.id} className={cn(styles.feedRow, bid.isMine && styles.feedMine)}>
              <span className={styles.feedAmount}>
                {bid.isMine && <Icon name="profile" size={14} className={styles.feedIcon} />}
                {formatRubles(bid.amountCents)}
                {bid.isMine && ' · вы'}
              </span>
              <span className={styles.feedMeta}>
                {bid.isMine ? formatAgo(bid.createdAt) : `${bid.bidder} · ${formatAgo(bid.createdAt)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
