import { useState } from 'react'

import type { LotDetail } from '@/entities/lot'
import { cn } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import { statusLabels } from '../lib/format'
import styles from './LotPage.module.css'

/** Сколько миниатюр видно сразу; остальные — за плиткой «+N» */
const VISIBLE_THUMBS = 4

const pad = (value: number) => String(value).padStart(2, '0')

type LotGalleryProps = {
  lot: LotDetail
  title: string
}

export const LotGallery = ({ lot, title }: LotGalleryProps) => {
  const [index, setIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const { photos } = lot
  const current = photos[index] ?? photos[0]

  const badge = (
    <span className={cn(styles.statusBadge, lot.status === 'active' && styles.statusActive)}>
      {statusLabels[lot.status]}
    </span>
  )

  if (!current) {
    return (
      <div className={styles.gallery}>
        <div className={cn(styles.mainPhoto, styles.noPhoto)}>
          {badge}
          <Icon name="car" size={36} />
          <span>Продавец не добавил фото</span>
        </div>
      </div>
    )
  }

  const go = (delta: number) => setIndex((index + delta + photos.length) % photos.length)
  const hiddenCount = photos.length - VISIBLE_THUMBS
  const thumbs = showAll || hiddenCount <= 1 ? photos : photos.slice(0, VISIBLE_THUMBS)

  return (
    <div className={styles.gallery}>
      <div className={styles.mainPhoto}>
        <img src={current.url} alt={`${title}, фото ${index + 1} из ${photos.length}`} className={styles.mainImage} />
        {badge}
        {photos.length > 1 && (
          <>
            <button type="button" className={cn(styles.galleryNav, styles.galleryPrev)} onClick={() => go(-1)} aria-label="Предыдущее фото">‹</button>
            <button type="button" className={cn(styles.galleryNav, styles.galleryNext)} onClick={() => go(1)} aria-label="Следующее фото">›</button>
            <span className={styles.counter}>{pad(index + 1)} / {pad(photos.length)}</span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className={styles.thumbs}>
          {thumbs.map((photo, photoIndex) => (
            <button
              key={photo.id}
              type="button"
              className={cn(styles.thumb, photoIndex === index && styles.thumbActive)}
              onClick={() => setIndex(photoIndex)}
              aria-label={`Фото ${photoIndex + 1}`}
              aria-pressed={photoIndex === index}
            >
              <img src={photo.thumbUrl} alt="" loading="lazy" />
            </button>
          ))}
          {thumbs.length < photos.length && (
            <button type="button" className={cn(styles.thumb, styles.thumbMore)} onClick={() => setShowAll(true)}>
              +{hiddenCount}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
