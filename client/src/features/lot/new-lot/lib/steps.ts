import type { LotDetailsDraft, LotDraft } from '../model/drafts.store'

/** Шаги живут в URL: «Назад» в браузере переключает шаги, перезагрузка оставляет на том же экране. */
export const newLotPaths = {
  root: '/new-lot',
  car: (draftId: string) => `/new-lot/${draftId}/car`,
  carNew: (draftId: string) => `/new-lot/${draftId}/car/new`,
  details: (draftId: string) => `/new-lot/${draftId}/details`,
  review: (draftId: string) => `/new-lot/${draftId}/review`,
}

export const isDetailsFilled = (details: LotDetailsDraft) => Object.values(details).every((value) => value.trim() !== '')

/** Первый незаполненный шаг — туда ведёт «Продолжить» в списке черновиков и защита шагов от перескока. */
export const nextStepPath = (draft: LotDraft) => {
  if (!draft.car) return newLotPaths.car(draft.id)
  if (!isDetailsFilled(draft.details)) return newLotPaths.details(draft.id)
  return newLotPaths.review(draft.id)
}

export const nextStepLabel = (draft: LotDraft) => {
  if (!draft.car) return 'Выбор машины'
  if (!isDetailsFilled(draft.details)) return 'Данные объявления'
  return 'Готов к публикации'
}
