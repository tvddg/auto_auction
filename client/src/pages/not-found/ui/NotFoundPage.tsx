import { useNavigate } from "react-router";
import { Button } from "@/shared/ui";
import cl from "./NotFoundPage.module.css"

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <main className={cl.page}>
            <div className={cl.content}>
                <h1 className={cl.code}>404</h1>
                <p className={cl.message}>Такой страницы не существует</p>
                <Button size="lg" onClick={() => navigate("/")}>
                    На главную
                </Button>
            </div>
        </main>
    )
}
