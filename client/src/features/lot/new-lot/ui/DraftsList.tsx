import { Button } from '@/shared/ui'
import { useNavigateKeepingState } from '@/shared/lib'

import { newLotPaths, nextStepLabel, nextStepPath } from '../lib/steps'
import { useDraftsStore, useUserDrafts } from '../model/drafts.store'
import { useDraftsUserId } from '../model/use-active-draft'
import styles from './NewLot.module.css'
import { StepHeader } from './StepHeader'

const formatUpdatedAt = (timestamp: number) =>
  new Date(timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** /new-lot — список черновиков пользователя и кнопка нового объявления. */
export const DraftsList = () => {
  const userId = useDraftsUserId()
  const draftsById = useUserDrafts(userId)
  const createDraft = useDraftsStore((state) => state.createDraft)
  const removeDraft = useDraftsStore((state) => state.removeDraft)
  const navigate = useNavigateKeepingState()

  // Сортируем в рендере, а не в селекторе стора: селектор, возвращающий новый массив, зациклит ререндеры
  const drafts = Object.values(draftsById).sort((a, b) => b.updatedAt - a.updatedAt)

  const handleCreate = () => {
    // Новый черновик всегда начинается с выбора машины
    navigate(newLotPaths.car(createDraft(userId)))
  }

  const handleRemove = (draftId: string, title: string) => {
    if (window.confirm(`Удалить черновик «${title}»?`)) removeDraft(userId, draftId)
  }

  return (
    <div className={styles.step}>
      <StepHeader title="Черновики" />

      <Button size="lg" fullWidth onClick={handleCreate}>
        Новое объявление
      </Button>

      {drafts.length === 0 ? (
        <p className={styles.muted}>Черновиков пока нет. Незаконченные объявления сохраняются здесь автоматически.</p>
      ) : (
        <ul className={styles.list}>
          {drafts.map((draft) => {
            const title = draft.car?.title ?? 'Машина не выбрана'

            return (
              <li key={draft.id} className={styles.card}>
                <span className={styles.cardTitle}>{title}</span>
                <span className={styles.muted}>
                  {nextStepLabel(draft)} · изменён {formatUpdatedAt(draft.updatedAt)}
                </span>
                <div className={styles.cardActions}>
                  <Button onClick={() => navigate(nextStepPath(draft))}>Продолжить</Button>
                  <Button variant="secondary" onClick={() => handleRemove(draft.id, title)}>Удалить</Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
