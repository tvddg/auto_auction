import { useNavigateKeepingState } from '@/shared/lib'

import styles from './NewLot.module.css'

type StepHeaderProps = {
  title: string
  /** «Шаг 1 из 3» — у списка черновиков не показываем. */
  caption?: string
  /** Куда ведёт кнопка «←». */
  backTo?: string
}

export const StepHeader = ({ title, caption, backTo }: StepHeaderProps) => {
  const navigate = useNavigateKeepingState()

  return (
    <div className={styles.stepHeader}>
      {backTo && (
        <button type="button" className={styles.back} onClick={() => navigate(backTo)} aria-label="Назад">
          ←
        </button>
      )}
      <div>
        {caption && <div className={styles.stepCaption}>{caption}</div>}
        <h3 className={styles.stepTitle}>{title}</h3>
      </div>
    </div>
  )
}
