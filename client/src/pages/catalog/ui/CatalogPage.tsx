import cl from "./CatalogPage.module.css"

import { LotCategories } from "@/features/lot/lot-categories"
import { LotFilters } from "@/features/lot/lot-filters"
import { LotSort } from "@/features/lot/lot-sort"
import { SearchField } from "@/shared/ui"
import { CardsGrid, CardsGridItem } from "@/widgets/cards-grid"
import { Header } from "@/widgets/header"
import { NavBar } from "@/widgets/nav-bar"

// TODO: заменить на карточки лотов
const cardStubs = Array.from({ length: 12 }, (_, i) => i)

export function CatalogPage() {
    return <main>
        <div className={cl.headerTab}>
            <Header />
            <SearchField />
            <LotCategories />
            <LotFilters />
            <div className={cl.listToolbar}>
                <span className={cl.lotsCount}>128 лотов</span>
                <LotSort />
            </div>
            <div className={cl.separator} />
        </div>

        <CardsGrid>
            {cardStubs.map((i) => (
                <CardsGridItem key={i}>
                    <div className={cl.cardStub} />
                </CardsGridItem>
            ))}
        </CardsGrid>

        <NavBar />
    </main>
}
