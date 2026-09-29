import { create } from "zustand";

export type SortKey = 'date' | 'cost' | 'year';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
    sortKey: SortKey;
    order: SortOrder;
    changeKey: (key: SortKey) => void;
    changeOrder: (order: SortOrder) => void;
}

const initialState = {
    sortKey: 'date' as SortKey,
    order: 'desc' as SortOrder
};

export const useSortStore = create<SortState>()((set) => ({
    ...initialState,
    changeKey: (key: SortKey) => set({ sortKey: key }),
    changeOrder: (order: SortOrder) => set({ order })
}));