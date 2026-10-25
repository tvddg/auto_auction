/** Черновик фильтров в окне: строки как в полях ввода, в стор попадают только после «Применить». */
export type FiltersDraft = {
  brands: string
  minYear: string
  maxYear: string
  minPrice: string
  maxPrice: string
}

export type FiltersValues = {
  brandsId: string[] | null
  minYear: number | null
  maxYear: number | null
  minPrice: number | null
  maxPrice: number | null
}

export type FiltersErrors = Partial<Record<'years' | 'price', string>>

const MIN_YEAR = 1900
const MAX_YEAR = 2100

export const onlyDigits = (value: string) => value.replace(/\D/g, '')

const toNumber = (value: string): number | null => (value === '' ? null : Number(value))
const toText = (value: number | null) => (value === null ? '' : String(value))

export const toDraft = (values: FiltersValues): FiltersDraft => ({
  brands: values.brandsId?.join(', ') ?? '',
  minYear: toText(values.minYear),
  maxYear: toText(values.maxYear),
  minPrice: toText(values.minPrice),
  maxPrice: toText(values.maxPrice),
})

export const parseDraft = (draft: FiltersDraft): { values: FiltersValues; errors: FiltersErrors } => {
  const brands = [...new Set(draft.brands.split(',').map((brand) => brand.trim()).filter(Boolean))]
  const values: FiltersValues = {
    brandsId: brands.length ? brands : null,
    minYear: toNumber(draft.minYear),
    maxYear: toNumber(draft.maxYear),
    minPrice: toNumber(draft.minPrice),
    maxPrice: toNumber(draft.maxPrice),
  }

  const errors: FiltersErrors = {}
  const years = [values.minYear, values.maxYear].filter((year) => year !== null)
  if (years.some((year) => year < MIN_YEAR || year > MAX_YEAR)) {
    errors.years = `Год — от ${MIN_YEAR} до ${MAX_YEAR}`
  } else if (values.minYear !== null && values.maxYear !== null && values.minYear > values.maxYear) {
    errors.years = '«От» не может быть больше «до»'
  }

  if (values.minPrice !== null && values.maxPrice !== null && values.minPrice > values.maxPrice) {
    errors.price = '«От» не может быть больше «до»'
  }

  return { values, errors }
}
