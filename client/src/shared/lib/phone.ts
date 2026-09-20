/** Работа с российскими номерами: в состоянии храним только цифры вида 79260000000. */

export const PHONE_DIGITS_LENGTH = 11
const COUNTRY_CODE = '7'

export const PHONE_PLACEHOLDER = '+7 926 000-00-00'

/** Приводит любой пользовательский ввод к цифрам с кодом страны 7. */
export const normalizePhoneDigits = (input: string): string => {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('8')) digits = COUNTRY_CODE + digits.slice(1)
  else if (digits.startsWith('9')) digits = COUNTRY_CODE + digits
  else if (digits.length > 0 && !digits.startsWith(COUNTRY_CODE)) digits = COUNTRY_CODE + digits

  return digits.slice(0, PHONE_DIGITS_LENGTH)
}

/** 7926000 -> «+7 926 000» (маска дорисовывается по мере ввода). */
export const formatPhone = (digits: string): string => {
  if (digits.length === 0) return ''

  const rest = digits.slice(1)
  const parts = [rest.slice(0, 3), rest.slice(3, 6), rest.slice(6, 8), rest.slice(8, 10)].filter(
    (part) => part.length > 0,
  )

  const [code, first, second, third] = parts
  let result = `+${COUNTRY_CODE}`
  if (code) result += ` ${code}`
  if (first) result += ` ${first}`
  if (second) result += `-${second}`
  if (third) result += `-${third}`

  return result
}

export const isPhoneComplete = (digits: string): boolean => digits.length === PHONE_DIGITS_LENGTH

// Формат для отправки на сервер.
export const toE164 = (digits: string): string => `+${digits}`
