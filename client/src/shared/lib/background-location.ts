import { useCallback } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'

/**
 * «Фоновый» маршрут для шторок: открывая /new-lot, кладём в state адрес страницы, с которой пришли.
 * AppRoutes рисует под шторкой эту страницу, а не саму /new-lot. Состояние хранится в history.state,
 * поэтому переживает перезагрузку; при заходе по прямой ссылке его нет — тогда фон по умолчанию.
 */
export type BackgroundLocationState = { backgroundLocation: Location }

export const getBackgroundLocation = (state: unknown): Location | null => {
  const value = (state as Partial<BackgroundLocationState> | null)?.backgroundLocation
  return value && typeof value.pathname === 'string' ? value : null
}

/** Переходы внутри шторки обязаны нести state дальше, иначе фон под шторкой пропадёт. */
export const useNavigateKeepingState = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (to: string, options?: { replace?: boolean }) => navigate(to, { ...options, state: location.state }),
    [navigate, location.state],
  )
}
