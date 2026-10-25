/** Копейки → «2 350 000 ₽». Все суммы в API — в копейках, в интерфейсе — целые рубли. */
export const formatRubles = (cents: number) => `${Math.round(cents / 100).toLocaleString('ru-RU')} ₽`

export const centsToRubles = (cents: number) => Math.round(cents / 100)

export const rublesToCents = (rubles: number) => rubles * 100
