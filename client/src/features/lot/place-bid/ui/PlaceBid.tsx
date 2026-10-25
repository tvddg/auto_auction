import { useId, useRef, useState, type SubmitEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'

import type { LotDetail } from '@/entities/lot'
import { useIsAuthenticated } from '@/entities/session'
import { apiErrorCodes, getErrorMessage, isApiError } from '@/shared/api'
import { buildReturnToState, centsToRubles, cn, formatRubles, rublesToCents } from '@/shared/lib'
import { Button, FormError, TintedIcon } from '@/shared/ui'

import { usePlaceBid } from '../api/use-place-bid'
import styles from './PlaceBid.module.css'

/** Быстрые надбавки к текущей цене — в шагах ставки */
const QUICK_STEPS = [1, 2, 4]

const onlyDigits = (value: string) => value.replace(/\D/g, '')
const formatNumber = (rubles: number) => rubles.toLocaleString('ru-RU')

type PlaceBidProps = {
  lot: LotDetail
}

/** Блок «Ваша ставка»: быстрые надбавки, поле суммы и отправка ставки. Показывается, пока идут торги. */
export const PlaceBid = ({ lot }: PlaceBidProps) => {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const inputId = useId()

  const placeBid = usePlaceBid()

  // null — пользователь сумму не трогал, и она следует за минимальной ставкой (перебили — поле обновилось)
  const [customRubles, setCustomRubles] = useState<number | null>(null)
  // Ключ живёт до определённого ответа сервера: повтор после обрыва сети не создаст вторую ставку
  const idempotencyKeyRef = useRef<string | null>(null)

  if (lot.bidStep === null || lot.minNextBid === null) {
    return <p className={styles.note}>Ставки временно недоступны. Попробуйте позже</p>
  }

  const stepRubles = centsToRubles(lot.bidStep)
  const minRubles = centsToRubles(lot.minNextBid)
  const currentRubles = centsToRubles(lot.currentPrice)
  const amountRubles = customRubles ?? minRubles
  const isBelowMin = amountRubles < minRubles

  const setAmount = (rubles: number | null) => {
    setCustomRubles(rubles)
    idempotencyKeyRef.current = null // другая сумма — другая ставка
    placeBid.reset()
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBelowMin || placeBid.isPending) return

    idempotencyKeyRef.current ??= crypto.randomUUID()
    placeBid.mutate(
      { dto: { lotId: lot.id, amountCents: rublesToCents(amountRubles) }, idempotencyKey: idempotencyKeyRef.current },
      {
        onSuccess: () => {
          idempotencyKeyRef.current = null
          setCustomRubles(null)
        },
        onError: (error) => {
          // Сеть оборвалась — ключ оставляем, чтобы повтор был той же ставкой; на ответ сервера — новый ключ
          if (!(isApiError(error) && error.code === apiErrorCodes.networkError)) idempotencyKeyRef.current = null
        },
      },
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root}>
        <Header stepRubles={stepRubles} />
        <Button size="lg" fullWidth onClick={() => navigate('/auth', { state: buildReturnToState(location) })}>
          Войдите, чтобы сделать ставку
        </Button>
      </div>
    )
  }

  if (lot.viewer?.isSeller) {
    return <p className={styles.note}>Это ваш лот — ставки на него делают другие участники</p>
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <Header stepRubles={stepRubles} />

      <div className={styles.quick}>
        {QUICK_STEPS.map((steps) => (
          <button
            key={steps}
            type="button"
            className={cn(styles.quickButton, amountRubles === currentRubles + steps * stepRubles && styles.quickActive)}
            onClick={() => setAmount(currentRubles + steps * stepRubles)}
          >
            +{formatNumber(steps * stepRubles)}
          </button>
        ))}
      </div>

      <label className={cn(styles.amount, isBelowMin && styles.amountInvalid)} htmlFor={inputId}>
        <input
          id={inputId}
          className={styles.amountInput}
          inputMode="numeric"
          autoComplete="off"
          aria-label="Сумма ставки, ₽"
          value={amountRubles ? formatNumber(amountRubles) : ''}
          onChange={(event) => setAmount(Number(onlyDigits(event.target.value)) || 0)}
        />
        <span className={styles.currency}>₽</span>
        <TintedIcon name="pen" size={20} className={styles.pen} />
      </label>

      {isBelowMin && <p className={styles.hint}>Минимальная ставка — {formatRubles(lot.minNextBid)}</p>}
      {lot.viewer?.isLeader && !placeBid.isSuccess && (
        <p className={styles.leading}>Ваша ставка сейчас лидирует</p>
      )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={placeBid.isPending}
        disabled={isBelowMin || placeBid.isPending}
        trailing={<TintedIcon name="hammer" size={22} />}
        className={styles.submit}
      >
        Сделать ставку
      </Button>

      {placeBid.isSuccess && <p className={styles.success} role="status">Ставка принята — вы лидируете</p>}
      <FormError message={placeBid.isError ? getErrorMessage(placeBid.error) : null} />
    </form>
  )
}

const Header = ({ stepRubles }: { stepRubles: number }) => (
  <div className={styles.header}>
    <span className={styles.label}>Ваша ставка</span>
    <span className={styles.step}>шаг {formatNumber(stepRubles)} ₽</span>
  </div>
)
