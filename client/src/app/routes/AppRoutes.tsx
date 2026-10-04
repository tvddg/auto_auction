import { Route, Routes, Navigate } from "react-router";
import { AuthPage } from "@/pages/auth";
import { CatalogPage } from "@/pages/catalog";
import { NotFoundPage } from "@/pages/not-found";

export function AppRoutes() {
    return (<Routes>
        <Route index element={ <Navigate to="catalog" replace /> }/>
        <Route path="auth" element={ <AuthPage /> }/>
        <Route path="catalog" element={ <CatalogPage /> }/>
        <Route path="*" element={ <NotFoundPage /> }/>
    </Routes>)      
}