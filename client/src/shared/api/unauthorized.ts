type Handler = () => void

const handlers = new Set<Handler>()

export const onUnauthorized = (handler: Handler): (() => void) => {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

export const emitUnauthorized = () => {
  handlers.forEach((handler) => handler())
}
