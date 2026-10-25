import { useState } from "react";

import cl from "./CatalogPage.module.css"

import { useLotsInfiniteQuery, type LotListFilters } from "@/entities/lot"
import { toLotCardProps } from "@/features/lot/lot-card"
import { LotCategories, useLotCategory } from "@/features/lot/lot-categories"
import { LotFilters, useFiltersStore } from "@/features/lot/lot-filters"
import { LotSort, useSortStore } from "@/features/lot/lot-sort"
import { getErrorMessage } from "@/shared/api"
import { useDebouncedValue } from "@/shared/lib"
import { Button, SearchField } from "@/shared/ui"
import { CardsGrid } from "@/widgets/cards-grid"
import { Header } from "@/widgets/header"
import { NavBar } from "@/widgets/nav-bar"

const SEARCH_DEBOUNCE_MS = 300

const lotsForms: Record<Intl.LDMLPluralRule, string> = {
    zero: "лотов", one: "лот", two: "лота", few: "лота", many: "лотов", other: "лота",
};
const pluralRules = new Intl.PluralRules("ru-RU");
const formatLotsCount = (count: number) => `${count} ${lotsForms[pluralRules.select(count)]}`;

// Фильтры хранят цены в рублях, API ждёт копейки
const toCents = (rubles: number | null) => rubles === null ? undefined : rubles * 100;

/** Собирает параметры GET /lot из вкладки, фильтров, сортировки и поиска. */
function useCatalogFilters(search: string): LotListFilters {
    const [category] = useLotCategory();
    const brands = useFiltersStore((state) => state.brandsId);
    const minYear = useFiltersStore((state) => state.minYear);
    const maxYear = useFiltersStore((state) => state.maxYear);
    const minPrice = useFiltersStore((state) => state.minPrice);
    const maxPrice = useFiltersStore((state) => state.maxPrice);
    const sort = useSortStore((state) => state.sortKey);
    const order = useSortStore((state) => state.order);

    return {
        status: category,
        brands: brands?.length ? brands : undefined,
        minYear: minYear ?? undefined,
        maxYear: maxYear ?? undefined,
        minPrice: toCents(minPrice),
        maxPrice: toCents(maxPrice),
        q: search.trim() || undefined,
        sort,
        order,
    };
}

export function CatalogPage() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const filters = useCatalogFilters(debouncedSearch);

    const lotsQuery = useLotsInfiniteQuery(filters);
    const pages = lotsQuery.data?.pages ?? [];
    const cards = pages.flatMap((page) => page.items).map(toLotCardProps);
    const total = pages[0]?.total;

    let content;
    if (lotsQuery.isPending) {
        content = <p className={cl.status}>Загружаем лоты…</p>;
    } else if (lotsQuery.isError && cards.length === 0) {
        content = <div className={cl.status}>
            <p>{getErrorMessage(lotsQuery.error)}</p>
            <Button variant="secondary" onClick={() => lotsQuery.refetch()}>Повторить</Button>
        </div>;
    } else if (cards.length === 0) {
        content = <p className={cl.status}>Ничего не найдено. Попробуйте изменить фильтры или запрос</p>;
    } else {
        content = <>
            <CardsGrid cards={cards} />
            {lotsQuery.hasNextPage && <div className={cl.more}>
                <Button
                    variant="secondary"
                    loading={lotsQuery.isFetchingNextPage}
                    onClick={() => lotsQuery.fetchNextPage()}
                >
                    Показать ещё
                </Button>
            </div>}
        </>;
    }

    return <>
        <Header />
        <main>
            <div className={cl.headerTab}>
                <SearchField
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Поиск лотов"
                />
                <LotCategories />
                <LotFilters />
                <div className={cl.listToolbar}>
                    <span className={cl.lotsCount} aria-live="polite">
                        {total === undefined ? "…" : formatLotsCount(total)}
                    </span>
                    <LotSort />
                </div>
                <div className={cl.separator} />
            </div>

            <div className={cl.cardsGrid} aria-busy={lotsQuery.isFetching}>
                {content}
            </div>

            <NavBar />
        </main>
    </>
}
