import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router'

import { lotKeys, useMyLotsQuery, type LotStatus, type MyLot } from '@/entities/lot'
import { useSessionUser } from '@/entities/session'
import {
  draftProgress,
  formatMissing,
  nextStepPath,
  useDraftsStore,
  useUserDrafts,
  type LotDraft,
} from '@/features/lot/new-lot'
import { getErrorMessage } from '@/shared/api'
import { cn, formatCountdown, formatRubles, useCountdown, type BackgroundLocationState } from '@/shared/lib'
import { Button, ConfirmDialog, Icon } from '@/shared/ui'
import { NavBar } from '@/widgets/nav-bar'

import styles from './MyLotsPage.module.css'

type Filter = 'all' | 'drafts' | 'sold'

/** Порядок групп в списке: что требует внимания — выше */
const GROUP_ORDER: (LotStatus | 'draft')[] = ['active', 'upcoming', 'draft', 'sold', 'unsold', 'cancelled']

const statusBadges: Record<LotStatus | 'draft', string> = {
  active: 'Торги',
  upcoming: 'Скоро старт',
  draft: 'Черновик',
  sold: 'Продан',
  unsold: 'Не продан',
  cancelled: 'Снят',
}

const bidsForms: Record<Intl.LDMLPluralRule, string> = {
  zero: 'ставок', one: 'ставка', two: 'ставки', few: 'ставки', many: 'ставок', other: 'ставки',
}
const pluralRules = new Intl.PluralRules('ru-RU')
const formatBids = (count: number) => `${count} ${bidsForms[pluralRules.select(count)]}`

const formatDay = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')
const formatStart = (iso: string) =>
  `${formatDay(iso)}, ${new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`

/** Шторка нового лота открывается поверх этой страницы — передаём её как фон */
const sheetState = (location: Location): BackgroundLocationState => ({ backgroundLocation: location })

const Badge = ({ kind }: { kind: LotStatus | 'draft' }) => (
  <span className={cn(styles.badge, styles[`badge_${kind}`])}>{statusBadges[kind]}</span>
)

const Timer = ({ endsAt }: { endsAt: string }) => {
  const queryClient = useQueryClient()
  const secondsLeft = useCountdown(new Date(endsAt).getTime())

  // Торги кончились — статус лота сменился, перезапрашиваем список
  useEffect(() => {
    if (secondsLeft === 0) void queryClient.invalidateQueries({ queryKey: lotKeys.mine() })
  }, [secondsLeft, queryClient])

  return (
    <span className={styles.timer}>
      <Icon name="redClock" size={16} />
      {formatCountdown(secondsLeft)}
    </span>
  )
}

const LotRow = ({ lot }: { lot: MyLot }) => {
  let meta: string
  switch (lot.status) {
    case 'active':
      meta = `${formatRubles(lot.currentPrice)} · ${formatBids(lot.bidCount)}`
      break
    case 'upcoming':
      meta = `Старт ${formatStart(lot.startsAt)} · от ${formatRubles(lot.startingPrice)}`
      break
    case 'sold':
      meta = [formatRubles(lot.currentPrice), lot.buyer && `покупатель ${lot.buyer}`, formatDay(lot.endsAt)].filter(Boolean).join(' · ')
      break
    case 'unsold':
      meta = `от ${formatRubles(lot.startingPrice)} · без ставок · ${formatDay(lot.endsAt)}`
      break
    case 'cancelled':
      meta = `${formatRubles(lot.currentPrice)} · ${formatBids(lot.bidCount)}`
      break
  }

  return (
    <li>
      <Link to={`/lot/${lot.lotId}`} className={cn(styles.row, styles[`row_${lot.status}`])}>
        <div className={styles.thumb}>
          {lot.imageUrl ? <img src={lot.imageUrl} alt="" loading="lazy" /> : <Icon name="car" size={28} />}
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{lot.title}</h2>
            <Badge kind={lot.status} />
          </div>
          <p className={styles.meta}>{meta}</p>
          {lot.status === 'active' && <Timer endsAt={lot.endsAt} />}
        </div>
      </Link>
    </li>
  )
}

const DraftRow = ({ draft, onDelete }: { draft: LotDraft; onDelete: () => void }) => {
  const location = useLocation()
  const { percent, missing } = draftProgress(draft)
  const cover = draft.photos[0]

  return (
    <li className={cn(styles.row, styles.row_draft)}>
      <div className={styles.thumb}>
        {cover ? (
          <img src={cover.url} alt="" loading="lazy" />
        ) : (
          <span className={styles.thumbText}>Нет фото</span>
        )}
        {draft.photos.length > 1 && <span className={styles.photoCount}>{draft.photos.length} фото</span>}
      </div>
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{draft.car?.title ?? 'Машина не выбрана'}</h2>
          <Badge kind="draft" />
        </div>
        <p className={styles.meta}>Заполнено {percent}% · {formatMissing(missing)}</p>
        <div className={styles.progress} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className={styles.draftActions}>
          <Link to={nextStepPath(draft)} state={sheetState(location)} className={styles.editButton}>
            Редактировать
          </Link>
          {/* TODO: иконка корзины, когда появится trash.png в assets */}
          <button type="button" className={styles.deleteButton} onClick={onDelete} aria-label="Удалить черновик">
            ×
          </button>
        </div>
      </div>
    </li>
  )
}

/** /my-lots — опубликованные лоты продавца (с сервера) и черновики (из браузера) одним списком */
export const MyLotsPage = () => {
  const user = useSessionUser()
  const location = useLocation()
  const navigate = useNavigate()
  const myLots = useMyLotsQuery()
  const drafts = useUserDrafts(user?.id ?? '')
  const removeDraft = useDraftsStore((state) => state.removeDraft)

  const [filter, setFilter] = useState<Filter>('all')
  const [draftToDelete, setDraftToDelete] = useState<LotDraft | null>(null)

  const lots = myLots.data ?? []
  const draftList = Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt)

  type Row = { kind: LotStatus | 'draft'; key: string; node: ReactNode }
  const rows: Row[] = [
    ...lots.map((lot) => ({ kind: lot.status, key: lot.lotId, node: <LotRow key={lot.lotId} lot={lot} /> })),
    ...draftList.map((draft) => ({
      kind: 'draft' as const,
      key: draft.id,
      node: <DraftRow key={draft.id} draft={draft} onDelete={() => setDraftToDelete(draft)} />,
    })),
  ].sort((a, b) => GROUP_ORDER.indexOf(a.kind) - GROUP_ORDER.indexOf(b.kind))

  const counts = { all: rows.length, drafts: draftList.length, sold: lots.filter((lot) => lot.status === 'sold').length }
  const visible = rows.filter((row) =>
    filter === 'all' ? true : filter === 'drafts' ? row.kind === 'draft' : row.kind === 'sold',
  )

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'drafts', label: 'Черновики' },
    { value: 'sold', label: 'Продано' },
  ]

  let content
  if (myLots.isPending) {
    content = <p className={styles.state}>Загружаем лоты…</p>
  } else if (myLots.isError) {
    content = (
      <div className={styles.state}>
        <p>{getErrorMessage(myLots.error)}</p>
        <Button variant="secondary" onClick={() => myLots.refetch()}>Повторить</Button>
      </div>
    )
  } else if (visible.length === 0) {
    content = (
      <p className={styles.state}>
        {filter === 'all' ? 'У вас пока нет лотов — создайте первый' : filter === 'drafts' ? 'Черновиков нет' : 'Проданных лотов пока нет'}
      </p>
    )
  } else {
    content = <ul className={styles.list}>{visible.map((row) => row.node)}</ul>
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Мои лоты</h1>
          <Button onClick={() => navigate('/new-lot', { state: sheetState(location) })} iconLeft={<span aria-hidden>+</span>}>
            Создать
          </Button>
        </div>

        <div className={styles.filters} role="tablist" aria-label="Фильтр лотов">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              className={cn(styles.filter, filter === item.value && styles.filterActive)}
              onClick={() => setFilter(item.value)}
            >
              {item.label} {counts[item.value]}
            </button>
          ))}
        </div>

        {content}
      </main>

      <ConfirmDialog
        open={draftToDelete !== null}
        title="Удалить черновик?"
        confirmLabel="Удалить"
        tone="danger"
        onConfirm={() => {
          if (user && draftToDelete) removeDraft(user.id, draftToDelete.id)
          setDraftToDelete(null)
        }}
        onCancel={() => setDraftToDelete(null)}
      >
        <p>Черновик «{draftToDelete?.car?.title ?? 'без машины'}» удалится без возможности восстановления.</p>
      </ConfirmDialog>

      <NavBar />
    </>
  )
}
