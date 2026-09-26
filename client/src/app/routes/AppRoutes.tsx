import { Route, Routes } from "react-router";
import { AuthPage } from "@/pages/auth";
import { MainPage } from "@/pages/main";
import { NotFoundPage } from "@/pages/not-found";

export function AppRoutes() {
    return (<Routes>
        <Route index element={ <MainPage /> }/>
        <Route path="auth" element={ <AuthPage /> }/>
        <Route path="*" element={ <NotFoundPage /> }/>
    </Routes>)      
}