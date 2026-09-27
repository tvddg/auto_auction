import { Icon } from "@/shared/ui";
import cl from "./Header.module.css";

export function Header() {
    return <header className={cl.layout}>
        <div className={cl.icon}>
            <Icon name="car" size={24}/>
        </div>
        <h1 className={cl.heading}>АВТОТОРГ</h1>

        <div className={cl.locAndNotifTab}>
            <div className={cl.location}>
                <Icon name="location" size={16}/>
                <h3>Москва</h3>
            </div>
            <div className={cl.notification}>
                <Icon name="notification" size={20}/>
            </div>
        </div>

    </header>
}
