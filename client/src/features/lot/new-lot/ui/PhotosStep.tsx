import { useRef, useState, type ChangeEvent } from 'react'

import { uploadPhoto } from '@/entities/lot'
import { getErrorMessage } from '@/shared/api'
import { NavigateKeepingState, useNavigateKeepingState } from '@/shared/lib'
import { Button } from '@/shared/ui'

import { isDetailsFilled, newLotPaths, nextStepPath } from '../lib/steps'
import { useDraftsStore, type DraftPhoto } from '../model/drafts.store'
import { useActiveDraft } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

// Те же ограничения, что на сервере (LotPhoto). Здесь — чтобы не отправлять заведомо неподходящий файл
const MAX_PHOTOS = 20
const MAX_BYTES = 15 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type Upload = {
  key: string
  name: string
  status: 'uploading' | 'error'
  message?: string
}

const precheck = (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Поддерживаются JPEG, PNG и WebP'
  if (file.size > MAX_BYTES) return 'Файл больше 15 МБ'
  return null
}

/** Шаг 3: фото. Файлы уходят на сервер сразу, в черновике остаются их signedId и превью. */
export const PhotosStep = () => {
  const { userId, draft, update } = useActiveDraft()
  const navigate = useNavigateKeepingState()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<Upload[]>([])

  const photos = draft.photos
  const isReachable = Boolean(draft.car) && isDetailsFilled(draft.details)
  const uploadingCount = uploads.filter((upload) => upload.status === 'uploading').length
  const freeSlots = MAX_PHOTOS - photos.length - uploadingCount

  const setUpload = (key: string, patch: Partial<Upload> | null) =>
    setUploads((prev) =>
      patch === null ? prev.filter((upload) => upload.key !== key) : prev.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)),
    )

  // Добавляем к СВЕЖЕМУ списку из стора, а не к photos из замыкания: пока файл грузился,
  // список мог измениться (другая загрузка, удаление), и мы бы затёрли эти изменения
  const appendPhoto = (photo: DraftPhoto) => {
    const latest = useDraftsStore.getState().draftsByUser[userId]?.[draft.id]
    if (latest) update({ photos: [...latest.photos, photo] })
  }

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(freeSlots, 0))
    // Сбрасываем input, чтобы повторный выбор того же файла тоже вызвал change
    event.target.value = ''

    const queue = files.map((file) => ({ file, key: crypto.randomUUID(), error: precheck(file) }))
    setUploads((prev) => [
      ...prev,
      ...queue.map(({ file, key, error }) => ({
        key,
        name: file.name,
        status: error ? ('error' as const) : ('uploading' as const),
        message: error ?? undefined,
      })),
    ])

    // По одному: порядок фото совпадает с порядком выбора, сервер не получает пачку запросов разом
    for (const { file, key, error } of queue) {
      if (error) continue
      try {
        appendPhoto(await uploadPhoto(file))
        setUpload(key, null)
      } catch (uploadError) {
        setUpload(key, { status: 'error', message: getErrorMessage(uploadError) })
      }
    }
  }

  // Меняем местами с соседом слева (-1) или справа (+1)
  const move = (index: number, delta: -1 | 1) => {
    const photo = photos[index]
    const neighbour = photos[index + delta]
    if (!photo || !neighbour) return

    update({ photos: photos.map((item, itemIndex) => (itemIndex === index ? neighbour : itemIndex === index + delta ? photo : item)) })
  }

  // Файл остаётся на сервере непривязанным — его удалит ежедневная очистка
  const remove = (index: number) => update({ photos: photos.filter((_, photoIndex) => photoIndex !== index) })

  // Перескок по ссылке до заполнения машины и данных — возвращаем на нужный шаг
  if (!isReachable) return <NavigateKeepingState to={nextStepPath(draft)} />

  return (
    <div className={styles.step}>
      <StepHeader caption="Шаг 3 из 4" title="Фото" backTo={newLotPaths.details(draft.id)} />
      <p className={styles.muted}>
        Первое фото — обложка в каталоге. До {MAX_PHOTOS} фото: JPEG, PNG или WebP до 15 МБ. Фото можно не добавлять.
      </p>

      <ul className={styles.photoGrid}>
        {photos.map((photo, index) => (
          <li key={photo.signedId} className={styles.photo}>
            <img src={photo.url} alt={`Фото ${index + 1}`} className={styles.photoImage} />
            {index === 0 && <span className={styles.photoBadge}>Обложка</span>}
            <div className={styles.photoActions}>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Сдвинуть раньше">←</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === photos.length - 1} aria-label="Сдвинуть позже">→</button>
              <button type="button" onClick={() => remove(index)} aria-label="Удалить фото">×</button>
            </div>
          </li>
        ))}

        {uploads.map((upload) => (
          <li key={upload.key} className={styles.photoPlaceholder} role={upload.status === 'error' ? 'alert' : 'status'}>
            <span className={styles.photoName}>{upload.name}</span>
            {upload.status === 'uploading' ? (
              <span className={styles.muted}>Загружаем…</span>
            ) : (
              <>
                <span className={styles.photoError}>{upload.message}</span>
                <button type="button" className={styles.photoDismiss} onClick={() => setUpload(upload.key, null)}>Скрыть</button>
              </>
            )}
          </li>
        ))}

        {freeSlots > 0 && (
          <li>
            <button type="button" className={styles.photoAdd} onClick={() => inputRef.current?.click()}>
              <span aria-hidden>+</span>
              Добавить фото
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        hidden
        onChange={(event) => void handleFiles(event)}
      />

      <div className={styles.actions}>
        <Button size="lg" trailing="→" disabled={uploadingCount > 0} onClick={() => navigate(newLotPaths.review(draft.id))}>
          {uploadingCount > 0 ? 'Дождитесь загрузки' : 'К проверке'}
        </Button>
      </div>
    </div>
  )
}
