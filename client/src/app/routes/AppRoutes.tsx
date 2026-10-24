import { Route, Routes, Navigate } from "react-router";
import { AuthPage } from "@/pages/auth";
import { CatalogPage } from "@/pages/catalog";
import { NotFoundPage } from "@/pages/not-found";

import { RequireAuth } from "./RequireAuth";

export function AppRoutes() {
    return (<Routes>
        <Route index element={ <Navigate to="catalog" replace /> }/>
        <Route path="auth" element={ <AuthPage /> }/>
        <Route path="catalog" element={ <CatalogPage /> }/>

        <Route element={ <RequireAuth /> }>
            <Route path="bets" element={ <NotFoundPage /> }/>
            <Route path="new-lot" element={ <NotFoundPage /> }/>
            <Route path="my-lots" element={ <NotFoundPage /> }/>
            <Route path="profile" element={ <NotFoundPage /> }/>
        </Route>

        <Route path="*" element={ <NotFoundPage /> }/>
    </Routes>)      
}