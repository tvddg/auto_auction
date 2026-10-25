import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { lotKeys, type LotRemoval } from '@/entities/lot'
import { getErrorMessage } from '@/shared/api'
import { Button, ConfirmDialog } from '@/shared/ui'

import { useDeleteLot } from '../api/use-delete-lot'

const copy: Record<LotRemoval, { button: string; title: string; confirm: string; text: string[] }> = {
  delete: {
    button: 'Удалить лот',
    title: 'Удалить лот?',
    confirm: 'Удалить',
    text: ['Объявление и его фото удалятся без возможности восстановления.'],
  },
  cancel: {
    button: 'Снять с торгов',
    title: 'Снять лот с торгов?',
    confirm: 'Снять с торгов',
    text: [
      'На лот уже делали ставки, поэтому удалить его нельзя — он будет снят с торгов.',
      'Лот пропадёт из каталога, участники увидят статус «Снят с торгов». Вернуть его на торги нельзя.',
    ],
  },
}

type DeleteLotProps = {
  lotId: string
  /** Что сделает сервер — приходит в viewer.removal, решать на клиенте не нужно */
  removal: LotRemoval
}

/** Кнопка владельца: удалить лот или снять с торгов — с подтверждением. */
export const DeleteLot = ({ lotId, removal }: DeleteLotProps) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const deleteLot = useDeleteLot()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const text = copy[removal]

  const handleConfirm = () =>
    deleteLot.mutate(lotId, {
      onSuccess: () => {
        // Сначала уходим со страницы, потом чистим кеш: иначе открытая страница перезапросит
        // удалённый лот и на мгновение покажет «лот не найден»
        navigate('/catalog', { replace: true })
        queryClient.removeQueries({ queryKey: lotKeys.detail(lotId) })
        void queryClient.invalidateQueries({ queryKey: lotKeys.root })
      },
    })

  const handleCancel = () => {
    setIsConfirming(false)
    deleteLot.reset()
  }

  return (
    <>
      <Button variant="danger" fullWidth onClick={() => setIsConfirming(true)}>
        {text.button}
      </Button>

      <ConfirmDialog
        open={isConfirming}
        title={text.title}
        confirmLabel={text.confirm}
        tone="danger"
        loading={deleteLot.isPending}
        error={deleteLot.isError ? getErrorMessage(deleteLot.error) : null}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {text.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </ConfirmDialog>
    </>
  )
}
