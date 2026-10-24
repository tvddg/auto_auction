import { Navigate, Outlet, useLocation } from "react-router";

import { useIsAuthenticated } from "@/entities/session";
import { buildReturnToState } from "@/shared/lib";

/** Закрытые разделы: без сессии отправляем на вход и запоминаем, куда вернуть. */
export function RequireAuth() {
    const isAuthenticated = useIsAuthenticated();
    const location = useLocation();

    if (!isAuthenticated)
        return <Navigate to="/auth" replace state={buildReturnToState(location)} />;

    return <Outlet />;
}
