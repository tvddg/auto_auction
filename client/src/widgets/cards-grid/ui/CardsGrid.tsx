import { LotCard, type LotCardProps } from "@/features/lot/lot-card";
import cl from "./CardsGrid.module.css";

export function CardsGrid({ cards }: { cards: LotCardProps[] }) {
    return <ul className={cl.grid}>
        {
            cards.map((card) => 
                <LotCard key={card.id} {...card}/>
            )
        }
    </ul>
}