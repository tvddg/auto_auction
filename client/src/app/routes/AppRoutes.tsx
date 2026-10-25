import { matchPath, Route, Routes, Navigate, useLocation } from "react-router";
import { AuthPage } from "@/pages/auth";
import { CatalogPage } from "@/pages/catalog";
import {
    CarCreateStep,
    CarPickStep,
    DetailsStep,
    DraftRoute,
    DraftStart,
    DraftsList,
    NewLotPage,
    PhotosStep,
    ReviewStep,
} from "@/pages/new-lot";
import { NotFoundPage } from "@/pages/not-found";
import { getBackgroundLocation, NavigateKeepingState } from "@/shared/lib";

import { RequireAuth } from "./RequireAuth";

/** Страница под шторкой, если её открыли по прямой ссылке и фона в state нет. */
const DEFAULT_SHEET_BACKGROUND = "/catalog";

/**
 * Шторки (сейчас — /new-lot/*) рисуются ПОВЕРХ страницы, с которой их открыли.
 *
 * Для этого два набора <Routes>:
 *  1. Страницы. Им передаём не настоящий адрес, а «фоновый» из location.state.backgroundLocation —
 *     и под шторкой продолжает жить, например, каталог со своими фильтрами и прокруткой.
 *  2. Шторки. Им — настоящий адрес, они рендерятся только на своих путях.
 */
export function AppRoutes() {
    const location = useLocation();
    const isSheetRoute = matchPath({ path: "/new-lot", end: false }, location.pathname) !== null;
    const pageLocation = isSheetRoute
        ? getBackgroundLocation(location.state) ?? DEFAULT_SHEET_BACKGROUND
        : location;

    return <>
        <Routes location={pageLocation}>
            <Route index element={ <Navigate to="catalog" replace /> }/>
            <Route path="auth" element={ <AuthPage /> }/>
            <Route path="catalog" element={ <CatalogPage /> }/>

            <Route element={ <RequireAuth /> }>
                {/* TODO: страниц разделов пока нет — после входа показываем 404 */}
                <Route path="bets" element={ <NotFoundPage /> }/>
                <Route path="my-lots" element={ <NotFoundPage /> }/>
                <Route path="profile" element={ <NotFoundPage /> }/>
            </Route>

            <Route path="*" element={ <NotFoundPage /> }/>
        </Routes>

        {isSheetRoute && <Routes>
            <Route element={ <RequireAuth /> }>
                <Route path="new-lot" element={ <NewLotPage /> }>
                    <Route index element={ <DraftsList /> }/>
                    <Route path=":draftId" element={ <DraftRoute /> }>
                        <Route index element={ <DraftStart /> }/>
                        <Route path="car" element={ <CarPickStep /> }/>
                        <Route path="car/new" element={ <CarCreateStep /> }/>
                        <Route path="details" element={ <DetailsStep /> }/>
                        <Route path="photos" element={ <PhotosStep /> }/>
                        <Route path="review" element={ <ReviewStep /> }/>
                    </Route>
                    <Route path="*" element={ <NavigateKeepingState to="/new-lot" /> }/>
                </Route>
            </Route>
        </Routes>}
    </>
}
