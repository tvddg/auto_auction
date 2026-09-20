export const MIN_PASSWORD_LENGTH = 8

// Проверка «на глаз», настоящая валидация — на сервере
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmailValid = (email: string): boolean => EMAIL_PATTERN.test(email.trim())

export const isPasswordValid = (password: string): boolean => password.length >= MIN_PASSWORD_LENGTH
