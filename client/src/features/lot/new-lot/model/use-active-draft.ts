import { useParams } from 'react-router'

import { useSessionUser } from '@/entities/session'

import { useDraft, useDraftsStore } from './drafts.store'

/** id вошедшего пользователя. Страница шторки рендерит шаги только когда профиль загружен. */
export const useDraftsUserId = () => {
  const user = useSessionUser()
  if (!user) throw new Error('Черновики доступны только после загрузки профиля')
  return user.id
}

/** Черновик из :draftId в URL. Может быть undefined — его отсеивает DraftRoute. */
export const useDraftFromUrl = () => {
  const userId = useDraftsUserId()
  const { draftId } = useParams()
  return { userId, draft: useDraft(userId, draftId) }
}

/** Для шагов внутри DraftRoute: черновик точно существует. */
export const useActiveDraft = () => {
  const { userId, draft } = useDraftFromUrl()
  const updateDraft = useDraftsStore((state) => state.updateDraft)

  if (!draft) throw new Error('useActiveDraft используется вне DraftRoute')

  return {
    userId,
    draft,
    update: (patch: Parameters<typeof updateDraft>[2]) => updateDraft(userId, draft.id, patch),
  }
}
