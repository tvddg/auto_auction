import cl from "./CardsGrid.module.css";
import type { PropsWithChildren } from "react";

export function CardsGrid({ children }: PropsWithChildren) {
    return <ul className={cl.grid}>{children}</ul>
}

export function CardsGridItem({ children }: PropsWithChildren) {
    return <li className={cl.item}>{children}</li>
}
