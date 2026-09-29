import cl from "./CatalogPage.module.css"

import vwImage from "@/assets/mockLotImages/vw.jpg";
import audiImage from "@/assets/mockLotImages/audi.webp";
import mercedesImage from "@/assets/mockLotImages/mercedes.jpeg";
import celicaImage from "@/assets/mockLotImages/celica.avif";

import type { LotCardProps } from "@/features/lot/lot-card"
import { LotCategories } from "@/features/lot/lot-categories"
import { LotFilters } from "@/features/lot/lot-filters"
import { LotSort } from "@/features/lot/lot-sort"
import { SearchField } from "@/shared/ui"
import { CardsGrid } from "@/widgets/cards-grid"
import { Header } from "@/widgets/header"
import { NavBar } from "@/widgets/nav-bar"

// TODO: заменить на данные из API
const mockLots: LotCardProps[] = [
    {
        id: "1", status: "active", remainingTime: 12 * 60_000 + 45_000,
        title: "Audi A3 Sportback Cashback Uzback 1.6 TDI DPI SPY", imageUrl: audiImage,
        shortInfo: { year: 2010, mileage: 187_000, gear: "МКПП" },
        price: 690_000, betsAmount: 14, inFeatured: false,
    },
    {
        id: "2", status: "active", remainingTime: (60 * 60 + 48 * 60 + 3) * 1000,
        title: "VW Golf GTI Clubsport", imageUrl: vwImage,
        shortInfo: { year: 2016, mileage: 74_000, gear: "DSG" },
        price: 2_350_000, betsAmount: 31, inFeatured: true,
    },
    {
        id: "3", status: "upcoming", startDate: new Date(2026, 8, 16, 12, 0),
        title: "Mercedes-Benz E 220 d", imageUrl: mercedesImage,
        shortInfo: { year: 2018, mileage: 121_000, gear: "АКПП" },
        price: 1_900_000, betsAmount: 0, inFeatured: false,
    },
    {
        id: "4", status: "sold", dealDate: new Date(2026, 8, 12),
        title: "Toyota Celica GT-Four", imageUrl: celicaImage,
        shortInfo: { year: 1994, mileage: 210_000, gear: "МКПП" },
        price: 1_480_000, betsAmount: 22, inFeatured: false,
    },
]

export function CatalogPage() {
    return <main>
        <div className={cl.headerTab}>
            <Header />
            <SearchField />
            <LotCategories />
            <LotFilters />
            <div className={cl.listToolbar}>
                <span className={cl.lotsCount}>{mockLots.length} лотов</span>
                <LotSort />
            </div>
            <div className={cl.separator} />
        </div>

        <div className={cl.cardsGrid}>
            <CardsGrid cards={mockLots} />
        </div>

        <NavBar />
    </main>
}
