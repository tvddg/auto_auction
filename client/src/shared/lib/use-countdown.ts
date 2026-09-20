import { useEffect, useState } from 'react'

const secondsLeft = (deadline: number | null): number => {
  if (deadline === null) return 0
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
}

export const useCountdown = (deadline: number | null): number => {
  const [left, setLeft] = useState(() => secondsLeft(deadline))

  useEffect(() => {
    setLeft(secondsLeft(deadline))
    if (deadline === null) return

    const timer = window.setInterval(() => {
      const next = secondsLeft(deadline)
      setLeft(next)
      if (next === 0) window.clearInterval(timer)
    }, 500)

    return () => window.clearInterval(timer)
  }, [deadline])

  return left
}

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
