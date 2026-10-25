import { useMutation } from '@tanstack/react-query'

import { createCar, fetchCar, type Car, type CreateCarDto } from '@/entities/car'
import { isApiError } from '@/shared/api'

/**
 * Результат создания машины. Если такая комплектация уже есть, сервер отвечает 409 car_exists
 * с existingId — для пользователя это не ошибка: подгружаем найденную машину и предлагаем выбрать её.
 */
export type CreateCarResult = { car: Car; existed: boolean }

export const useCreateCar = () =>
  useMutation({
    mutationFn: async (dto: CreateCarDto): Promise<CreateCarResult> => {
      try {
        return { car: await createCar(dto), existed: false }
      } catch (error) {
        const existingId = isApiError(error) && error.code === 'car_exists' ? error.payload.existingId : null
        if (typeof existingId !== 'string') throw error

        return { car: await fetchCar(existingId), existed: true }
      }
    },
  })
