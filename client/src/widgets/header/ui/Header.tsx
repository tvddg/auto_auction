import type { ReactNode } from "react";
import { Icon } from "@/shared/ui";
import cl from "./Header.module.css";

type HeaderProps = {
    actions?: ReactNode;
};

export function Header({ actions }: HeaderProps) {
    return <header className={cl.layout}>
        <div className={cl.icon}>
            <Icon name="car" size={24}/>
        </div>
        <h1 className={cl.heading}>АВТОТОРГ</h1>

        {actions && <div className={cl.actions}>{actions}</div>}
    </header>
}
