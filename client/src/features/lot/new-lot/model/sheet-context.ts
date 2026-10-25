import { createContext, useContext } from 'react'

export type NewLotSheetControls = {
  /**
   * Закрыть шторку с анимацией. afterClose выполнится, когда анимация доиграет, — например,
   * удаление опубликованного черновика: если удалить сразу, во время анимации мелькнёт список черновиков.
   */
  close: (afterClose?: () => void) => void
}

/** Саму шторку рендерит страница, а закрыть её нужно из шагов — поэтому функция идёт через контекст. */
export const NewLotSheetContext = createContext<NewLotSheetControls | null>(null)

export const useNewLotSheet = () => {
  const context = useContext(NewLotSheetContext)
  if (!context) throw new Error('useNewLotSheet используется вне шторки нового лота')
  return context
}
