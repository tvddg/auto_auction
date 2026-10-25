import type { CSSProperties } from "react";
import { NavLink, useLocation } from "react-router";

import { cn, getBackgroundLocation, type BackgroundLocationState } from "@/shared/lib";
import { iconSources, type IconName } from "@/shared/ui";
import cl from "./NavBar.module.css";

type NavItem = {
    to: string;
    label: string;
    icon?: IconName;
    /** Открывается шторкой поверх текущей страницы, а не вместо неё. */
    sheet?: boolean;
};

const navItems: NavItem[] = [
    { to: "/catalog", label: "Каталог", icon: "catalog" },
    { to: "/bets", label: "Ставки", icon: "bets" },
    { to: "/new-lot", label: "Лот", sheet: true },
    { to: "/my-lots", label: "Мои лоты", icon: "car" },
    { to: "/profile", label: "Профиль", icon: "profile" },
];

export function NavBar() {
    const location = useLocation();

    // Для шторки запоминаем текущую страницу как фон. Если шторка уже открыта — фон не меняем
    const sheetState: BackgroundLocationState = getBackgroundLocation(location.state)
        ? location.state as BackgroundLocationState
        : { backgroundLocation: location };

    return <nav className={cl.wrapper}>
        {navItems.map(({ to, label, icon, sheet }) => (
            <NavLink
                key={to}
                to={to}
                state={sheet ? sheetState : undefined}
                className={({ isActive }) => cn(cl.link, isActive && cl.active)}
            >
                {icon
                    ? <span
                        className={cl.icon}
                        style={{ "--icon": `url(${iconSources[icon]})` } as CSSProperties}
                        aria-hidden
                    />
                    : <span className={cn(cl.icon, cl.plus)} aria-hidden>+</span>}
                {label}
            </NavLink>
        ))}
    </nav>
}
