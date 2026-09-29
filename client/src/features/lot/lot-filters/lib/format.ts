const formatAmount = (value: number) => {
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000)} млн`
  if (value >= 1_000) return `${formatNumber(value / 1_000)} тыс`
  return formatNumber(value)
}

const formatNumber = (value: number) =>
  value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

export const formatYearRange = (min: number | null, max: number | null) => {
  if (min !== null && max !== null) return `${min}–${max}`
  if (min !== null) return `от ${min}`
  if (max !== null) return `до ${max}`
  return null
}

export const formatPriceRange = (min: number | null, max: number | null) => {
  if (min !== null && max !== null) return `${formatAmount(min)} – ${formatAmount(max)}`
  if (min !== null) return `от ${formatAmount(min)}`
  if (max !== null) return `до ${formatAmount(max)}`
  return null
}
