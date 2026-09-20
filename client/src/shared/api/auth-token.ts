const STORAGE_KEY = 'autotorg.access_token'

type Listener = (token: string | null) => void

const listeners = new Set<Listener>()

const read = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let cached: string | null = read()

const write = (token: string | null) => {
  cached = token
  try {
    if (token === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener(token))
}

// Access-токен живёт в localStorage (переживает перезагрузку вкладки),
// refresh-токен — в httpOnly-cookie, которую ставит сервер и которую JS не видит.
export const authToken = {
  get: (): string | null => cached,
  set: (token: string) => write(token),
  clear: () => write(null),
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      cached = event.newValue
      listener(event.newValue)
    }
    window.addEventListener('storage', onStorage)

    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },
}
