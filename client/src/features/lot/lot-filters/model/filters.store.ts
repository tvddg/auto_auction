import { create } from "zustand";

type FilterKeys = 'brandsId' | 'minYear' | 'maxYear' | 'minPrice' | 'maxPrice';

type FiltersState = Record<Exclude<FilterKeys, 'brandsId'>, number | null> & {
    brandsId: string[] | null;
}

const initialState: FiltersState = {
    brandsId: null,
    minYear: null,
    maxYear: null,
    minPrice: null,
    maxPrice: null
};

type FiltersActions = {
    setFilter: <K extends FilterKeys>(key: K, value: FiltersState[K]) => void;
    unsetFilter: (key: FilterKeys) => void;
    unsetAll: () => void;
}

export const useFiltersStore = create<FiltersState & FiltersActions>()((set) => ({
    ...initialState,

    setFilter: <K extends FilterKeys>(key: K, value: FiltersState[K]) => 
        set({ [key]: value }),

    unsetFilter: (key: FilterKeys) => set({ [key]: null }),

    unsetAll: () => set(initialState)
}));