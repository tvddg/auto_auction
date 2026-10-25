import { getErrorMessage, isApiError } from '@/shared/api'
import { NavigateKeepingState, useNavigateKeepingState } from '@/shared/lib'
import { Button, FormError } from '@/shared/ui'

import { usePublishLot } from '../api/use-publish-lot'
import { formatLocalDateTime, formatRubles, hasErrors, toCreateLotDto, validateDetails } from '../lib/form'
import { isDetailsFilled, newLotPaths, nextStepPath } from '../lib/steps'
import { useDraftsStore } from '../model/drafts.store'
import { useNewLotSheet } from '../model/sheet-context'
import { useActiveDraft } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

/** Шаг 3: всё проверить и опубликовать. Публикация = POST /lot, лот сразу виден в каталоге. */
export const ReviewStep = () => {
  const { userId, draft } = useActiveDraft()
  const navigate = useNavigateKeepingState()
  const removeDraft = useDraftsStore((state) => state.removeDraft)
  const sheet = useNewLotSheet()
  const publish = usePublishLot()

  // Проверка доступна только для заполненного черновика
  if (!draft.car || !isDetailsFilled(draft.details)) return <NavigateKeepingState to={nextStepPath(draft)} />

  const { car, details } = draft
  // Даты проверяем заново: черновик могли открыть спустя время, и начало уже прошло
  const staleErrors = Object.values(validateDetails(details))
  const isStale = hasErrors(staleErrors)

  const handlePublish = () => {
    publish.mutate(toCreateLotDto(car, details, draft.photos), {
      // Черновик удаляем после того, как шторка уехала, — иначе во время анимации мелькнёт список
      onSuccess: () => sheet.close(() => removeDraft(userId, draft.id)),
    })
  }

  // 422 приходит с ошибками по полям — показываем их списком и даём вернуться к нужному шагу
  const fieldErrors = isApiError(publish.error) && publish.error.details ? Object.values(publish.error.details).flat() : []
  const isPhotoError = isApiError(publish.error) && Boolean(publish.error.details?.photoIds)

  return (
    <div className={styles.step}>
      <StepHeader caption="Шаг 4 из 4" title="Проверка" backTo={newLotPaths.photos(draft.id)} />

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.stepCaption}>Машина</span>
          <Button variant="ghost" onClick={() => navigate(newLotPaths.car(draft.id))}>Изменить</Button>
        </div>
        <span className={styles.cardTitle}>{car.title}</span>
        <span className={styles.muted}>{car.specs}</span>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.stepCaption}>Объявление</span>
          <Button variant="ghost" onClick={() => navigate(newLotPaths.details(draft.id))}>Изменить</Button>
        </div>
        <dl className={styles.summary}>
          <dt>VIN</dt>
          <dd>{details.vin}</dd>
          <dt>Пробег</dt>
          <dd>{Number(details.mileage).toLocaleString('ru-RU')} км</dd>
          <dt>Цвет</dt>
          <dd>{details.color}</dd>
          <dt>Город</dt>
          <dd>{details.city}</dd>
          <dt>Стартовая цена</dt>
          <dd>{formatRubles(details.startingPrice)}</dd>
          <dt>Начало торгов</dt>
          <dd>{formatLocalDateTime(details.startsAt)}</dd>
          <dt>Окончание</dt>
          <dd>{formatLocalDateTime(details.endsAt)}</dd>
        </dl>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.stepCaption}>Фото · {draft.photos.length}</span>
          <Button variant="ghost" onClick={() => navigate(newLotPaths.photos(draft.id))}>Изменить</Button>
        </div>
        {draft.photos.length > 0 ? (
          <div className={styles.photoStrip}>
            {draft.photos.map((photo, index) => <img key={photo.signedId} src={photo.url} alt={`Фото ${index + 1}`} />)}
          </div>
        ) : (
          <span className={styles.muted}>Без фото — в каталоге будет заглушка</span>
        )}
      </section>

      {isStale && (
        <div className={styles.notice} role="alert">
          <ul className={styles.errorList}>
            {staleErrors.map((message, index) => <li key={index}>{message}</li>)}
          </ul>
          <Button variant="secondary" onClick={() => navigate(newLotPaths.details(draft.id))}>
            Исправить данные
          </Button>
        </div>
      )}

      {publish.isError && (
        <div className={styles.notice} role="alert">
          <FormError message={getErrorMessage(publish.error)} />
          {fieldErrors.length > 0 && (
            <>
              <ul className={styles.errorList}>
                {/* Сообщения у разных полей могут совпасть, поэтому ключ — индекс; список статичный */}
                {fieldErrors.map((message, index) => <li key={index}>{message}</li>)}
              </ul>
              <Button
                variant="secondary"
                onClick={() => navigate(isPhotoError ? newLotPaths.photos(draft.id) : newLotPaths.details(draft.id))}
              >
                {isPhotoError ? 'Исправить фото' : 'Исправить данные'}
              </Button>
            </>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button size="lg" loading={publish.isPending} disabled={isStale || publish.isPending} onClick={handlePublish}>
          Опубликовать
        </Button>
      </div>
    </div>
  )
}
