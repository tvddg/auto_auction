import type { CSSProperties } from "react";
import { NavLink } from "react-router";

import { cn } from "@/shared/lib";
import { iconSources, type IconName } from "@/shared/ui";
import cl from "./NavBar.module.css";

type NavItem = {
    to: string;
    label: string;
    icon?: IconName;
};

const navItems: NavItem[] = [
    { to: "/catalog", label: "Каталог", icon: "catalog" },
    { to: "/bets", label: "Ставки", icon: "bets" },
    { to: "/new-lot", label: "Лот" },
    { to: "/my-lots", label: "Мои лоты", icon: "car" },
    { to: "/profile", label: "Профиль", icon: "profile" },
];

export function NavBar() {
    return <nav className={cl.wrapper}>
        {navItems.map(({ to, label, icon }) => (
            <NavLink
                key={to}
                to={to}
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
