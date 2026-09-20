// Пустая ячейка кода внутри строки-значения хранится пробелом. 
export const EMPTY_CELL = ' '

export const isOtpFilled = (value: string, length = 4): boolean =>
  value.length === length && !value.includes(EMPTY_CELL)
