import { useSearchParams } from 'react-router'

export const LOT_CATEGORIES = [
  { value: 'active', label: 'Идут торги' },
  { value: 'upcoming', label: 'Скоро старт' },
  { value: 'finished', label: 'Завершённые' },
] as const

export type LotCategory = (typeof LOT_CATEGORIES)[number]['value']

export const LOT_CATEGORY_PARAM = 'status'
export const DEFAULT_LOT_CATEGORY: LotCategory = 'active'

const isLotCategory = (value: string | null): value is LotCategory =>
  LOT_CATEGORIES.some((category) => category.value === value)

export const useLotCategory = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = searchParams.get(LOT_CATEGORY_PARAM);
  const category = isLotCategory(raw) ? raw : DEFAULT_LOT_CATEGORY;

  const setCategory = (next: LotCategory) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);

        if (next === DEFAULT_LOT_CATEGORY) 
            params.delete(LOT_CATEGORY_PARAM);
        else 
            params.set(LOT_CATEGORY_PARAM, next);

        return params
      },
      { replace: true },
    )
  };

  return [category, setCategory] as const
}
