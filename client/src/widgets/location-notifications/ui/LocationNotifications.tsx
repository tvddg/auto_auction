import { Icon } from "@/shared/ui";
import cl from "./LocationNotifications.module.css";

export function LocationNotifications() {
    return <div className={cl.locAndNotifTab}>
        <div className={cl.location}>
            <Icon name="location" size={16}/>
            <h3>Москва</h3>
        </div>
        <div className={cl.notification}>
            <Icon name="notification" size={20}/>
        </div>
    </div>
}
