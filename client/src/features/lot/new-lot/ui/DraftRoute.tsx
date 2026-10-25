import { Outlet } from 'react-router'

import { NavigateKeepingState } from '@/shared/lib'

import { newLotPaths, nextStepPath } from '../lib/steps'
import { useActiveDraft, useDraftFromUrl } from '../model/use-active-draft'

/**
 * Обёртка над шагами /new-lot/:draftId/*. Если черновика нет (удалён, опубликован,
 * чужой или ссылка старая) — возвращаем к списку черновиков.
 */
export const DraftRoute = () => {
  const { draft } = useDraftFromUrl()
  if (!draft) return <NavigateKeepingState to={newLotPaths.root} />

  return <Outlet />
}

/** /new-lot/:draftId без шага — продолжаем с первого незаполненного. */
export const DraftStart = () => {
  const { draft } = useActiveDraft()
  return <NavigateKeepingState to={nextStepPath(draft)} />
}
