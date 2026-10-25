import { Navigate, useLocation } from 'react-router'

/** <Navigate>, который тоже сохраняет state — для редиректов между шагами. */
export const NavigateKeepingState = ({ to }: { to: string }) => {
  const location = useLocation()
  return <Navigate to={to} replace state={location.state} />
}
