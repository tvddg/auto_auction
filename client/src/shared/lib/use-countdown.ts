import { useEffect, useState } from 'react'

const secondsLeft = (deadline: number | null): number => {
  if (deadline === null) return 0
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
}

export const useCountdown = (deadline: number | null): number => {
  const [state, setState] = useState(() => ({ deadline, left: secondsLeft(deadline) }))

  if (state.deadline !== deadline) {
    setState({ deadline, left: secondsLeft(deadline) })
  }

  useEffect(() => {
    if (deadline === null) return

    const timer = window.setInterval(() => {
      const left = secondsLeft(deadline)
      setState({ deadline, left })
      if (left === 0) window.clearInterval(timer)
    }, 500)

    return () => window.clearInterval(timer)
  }, [deadline])

  return state.deadline === deadline ? state.left : secondsLeft(deadline)
}

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
