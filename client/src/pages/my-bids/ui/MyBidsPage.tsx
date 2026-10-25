import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'

import { bidKeys, useMyBidsQuery, type MyBid } from '@/entities/bid'
import { getErrorMessage } from '@/shared/api'
import { cn, formatCountdown, formatRubles, useCountdown } from '@/shared/lib'
import { Button, Icon } from '@/shared/ui'
import { NavBar } from '@/widgets/nav-bar'

import styles from './MyBidsPage.module.css'

const bidsForms: Record<Intl.LDMLPluralRule, string> = {
  zero: 'ставок', one: 'ставка', two: 'ставки', few: 'ставки', many: 'ставок', other: 'ставки',
}
const pluralRules = new Intl.PluralRules('ru-RU')

const MyBidRow = ({ bid }: { bid: MyBid }) => {
  const queryClient = useQueryClient()
  const secondsLeft = useCountdown(new Date(bid.endsAt).getTime())

  // Торги закончились — лот уходит из активных, перезапрашиваем список
  useEffect(() => {
    if (secondsLeft === 0) void queryClient.invalidateQueries({ queryKey: bidKeys.mine() })
  }, [secondsLeft, queryClient])

  return (
    <li>
      <Link to={`/lot/${bid.lotId}`} className={cn(styles.row, bid.isLeader ? styles.leading : styles.outbid)}>
        <div className={styles.thumb}>
          {bid.imageUrl ? <img src={bid.imageUrl} alt="" loading="lazy" /> : <Icon name="car" size={28} />}
        </div>

        <div className={styles.info}>
          <h2 className={styles.title}>{bid.title}</h2>
          <p className={styles.meta}>
            Моя {formatRubles(bid.myBid)}
            {' · '}
            {bid.isLeader
              ? `${bid.bidCount} ${bidsForms[pluralRules.select(bid.bidCount)]}`
              : `сейчас ${formatRubles(bid.currentPrice)}`}
          </p>
          <div className={styles.bottom}>
            <span className={cn(styles.badge, bid.isLeader ? styles.badgeLeading : styles.badgeOutbid)}>
              <span aria-hidden>{bid.isLeader ? '✓' : '↘'}</span>
              {bid.isLeader ? 'Вы лидер' : 'Перебита'}
            </span>
            <span className={styles.timer} aria-label="До конца торгов">{formatCountdown(secondsLeft)}</span>
          </div>
        </div>
      </Link>
    </li>
  )
}

/**
 * /bets — «Мои ставки» по макету, только активные: лоты с идущими торгами, где есть моя ставка.
 * Завершённые и отслеживаемые не показываем.
 */
export const MyBidsPage = () => {
  const myBids = useMyBidsQuery()
  const navigate = useNavigate()

  let content
  if (myBids.isPending) {
    content = <p className={styles.state}>Загружаем ставки…</p>
  } else if (myBids.isError) {
    content = (
      <div className={styles.state}>
        <p>{getErrorMessage(myBids.error)}</p>
        <Button variant="secondary" onClick={() => myBids.refetch()}>Повторить</Button>
      </div>
    )
  } else if (myBids.data.length === 0) {
    content = (
      <div className={styles.state}>
        <p>Вы пока не делали ставок на идущие торги</p>
        <Button onClick={() => navigate('/catalog')}>В каталог</Button>
      </div>
    )
  } else {
    content = (
      <ul className={styles.list}>
        {myBids.data.map((bid) => <MyBidRow key={bid.lotId} bid={bid} />)}
      </ul>
    )
  }

  return (
    <>
      <main className={styles.page}>
        <h1 className={styles.heading}>Мои ставки</h1>
        <div className={styles.tabs}>
          <span className={styles.tab}>
            Активные
            {myBids.data && myBids.data.length > 0 && <span className={styles.tabCount}>{myBids.data.length}</span>}
          </span>
        </div>
        {content}
      </main>
      <NavBar />
    </>
  )
}
