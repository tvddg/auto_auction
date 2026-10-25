import { useMemo, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { useSessionUser } from '@/entities/session'
import { NewLotSheetContext, type NewLotSheetControls } from '@/features/lot/new-lot'
import { getBackgroundLocation } from '@/shared/lib'
import { Sheet, type SheetHandle } from '@/shared/ui'

import styles from './NewLotPage.module.css'

/** Куда уходим после закрытия шторки, если её открыли по прямой ссылке и фона нет. */
const FALLBACK_BACKGROUND = '/catalog'

/**
 * /new-lot/* — шторка поверх страницы, с которой её открыли (см. AppRoutes).
 * Внутри — шаги через <Outlet />, сами шаги лежат в features/lot/new-lot.
 */
export const NewLotPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSessionUser()

  const sheetRef = useRef<SheetHandle>(null)
  const afterCloseRef = useRef<(() => void) | null>(null)

  const background = getBackgroundLocation(location.state)

  // Шторка закрылась (×, Esc или из шага) и доиграла анимацию — уходим на фоновую страницу
  const handleClosed = () => {
    afterCloseRef.current?.()
    afterCloseRef.current = null
    navigate(background ?? FALLBACK_BACKGROUND)
  }

  const controls = useMemo<NewLotSheetControls>(
    () => ({
      close: (afterClose) => {
        afterCloseRef.current = afterClose ?? null
        sheetRef.current?.close()
      },
    }),
    [],
  )

  return (
    <NewLotSheetContext value={controls}>
      <Sheet ref={sheetRef} title="Новое объявление" onClosed={handleClosed}>
        {/* После перезагрузки токен уже есть, а профиль ещё грузится — черновики привязаны к id пользователя */}
        {user ? <Outlet /> : <p className={styles.loading}>Загружаем профиль…</p>}
      </Sheet>
    </NewLotSheetContext>
  )
}
