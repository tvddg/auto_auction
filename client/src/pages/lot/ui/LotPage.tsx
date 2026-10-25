import { useNavigate, useParams, useLocation } from 'react-router'

import { useLotQuery } from '@/entities/lot'
import { DeleteLot } from '@/features/lot/delete-lot'
import { PlaceBid } from '@/features/lot/place-bid'
import { getErrorMessage, isApiError } from '@/shared/api'
import { Button, Icon, TintedIcon } from '@/shared/ui'

import { formatDateTime, formatSpecsLine } from '../lib/format'
import { BidFeedList } from './BidFeedList'
import { LotGallery } from './LotGallery'
import { LotPriceBlock } from './LotPriceBlock'
import { LotSpecs } from './LotSpecs'
import styles from './LotPage.module.css'

/**
 * Страница лота по макету «Карточка лота». Блоки, для которых пока нет данных
 * (дефекты, документы, доставка, резерв, автоставка, «Следить», «Поделиться»), не показываем.
 */
export const LotPage = () => {
  const { lotId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const lotQuery = useLotQuery(lotId)

  // Пришли из каталога — возвращаемся туда же с фильтрами; открыли по ссылке — в каталог
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/catalog'))

  const header = (
    <header className={styles.topBar}>
      <button type="button" className={styles.backButton} onClick={goBack} aria-label="Назад">←</button>
      <span className={styles.topTitle}>Лот</span>
    </header>
  )

  if (lotQuery.isPending) {
    return <main className={styles.page}>{header}<p className={styles.state}>Загружаем лот…</p></main>
  }

  if (lotQuery.isError) {
    const notFound = isApiError(lotQuery.error) && lotQuery.error.status === 404
    return (
      <main className={styles.page}>
        {header}
        <div className={styles.state}>
          <p>{notFound ? 'Такого лота нет — возможно, его удалили' : getErrorMessage(lotQuery.error)}</p>
          {notFound
            ? <Button onClick={() => navigate('/catalog')}>В каталог</Button>
            : <Button variant="secondary" onClick={() => lotQuery.refetch()}>Повторить</Button>}
        </div>
      </main>
    )
  }

  const lot = lotQuery.data
  const car = lot.carInfo
  const title = [car.brand, car.model, car.trim].filter(Boolean).join(' ')

  return (
    <main className={styles.page}>
      {header}
      <LotGallery lot={lot} title={title} />

      <div className={styles.content}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.specsLine}>{formatSpecsLine(car)}</p>
        </div>

        <LotPriceBlock lot={lot} />

        {lot.status === 'active' && <PlaceBid lot={lot} />}
        {lot.status === 'upcoming' && (
          <p className={styles.notice}>Ставки откроются {formatDateTime(lot.startsAt)}</p>
        )}

        <BidFeedList lot={lot} />
        <LotSpecs car={car} />

        {car.description && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Описание</h2>
            <p className={styles.text}>{car.description}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <TintedIcon name="location" className={styles.sectionIcon} />
            Локация
          </h2>
          <p className={styles.text}>{car.city}</p>
        </section>

        {lot.sellerInfo.name && (
          <p className={styles.seller}>
            <Icon name="profile" size={16} />
            Продавец: {lot.sellerInfo.name}
          </p>
        )}

        {/* В самом низу — действие владельца. Только когда сервер разрешает: removal = null — завершённый лот со ставками */}
        {lot.viewer?.removal && <DeleteLot lotId={lot.id} removal={lot.viewer.removal} />}
      </div>
    </main>
  )
}
