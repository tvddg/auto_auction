import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Поля формы машины — строками, как в инпутах; в числа превращаем только при отправке. */
export type CarFormDraft = {
  brand: string
  model: string
  trim: string
  year: string
  bodyType: string
  transmission: string
  driveType: string
  fuelType: string
  horsePower: string
  engineVolumeCc: string
  description: string
}

/** Данные объявления. Цена — в рублях, даты — значение <input type="datetime-local">. */
export type LotDetailsDraft = {
  vin: string
  mileage: string
  color: string
  city: string
  startingPrice: string
  startsAt: string
  endsAt: string
}

/** Выбранная машина: id для POST /lot и подписи, чтобы показывать её без запроса к серверу. */
export type DraftCar = {
  id: string
  title: string
  specs: string
}

/** Фото уже на сервере (POST /photo), но к лоту не привязано: signedId уйдёт в POST /lot. */
export type DraftPhoto = {
  signedId: string
  url: string
}

export type LotDraft = {
  id: string
  createdAt: number
  updatedAt: number
  car: DraftCar | null
  carForm: CarFormDraft
  details: LotDetailsDraft
  /** По порядку: первое — обложка. */
  photos: DraftPhoto[]
}

export type DraftPatch = {
  car?: DraftCar | null
  carForm?: Partial<CarFormDraft>
  details?: Partial<LotDetailsDraft>
  /** Список целиком — так проще менять порядок и удалять. */
  photos?: DraftPhoto[]
}

const emptyCarForm: CarFormDraft = {
  brand: '', model: '', trim: '', year: '', bodyType: '', transmission: '',
  driveType: '', fuelType: '', horsePower: '', engineVolumeCc: '', description: '',
}

const emptyDetails: LotDetailsDraft = {
  vin: '', mileage: '', color: '', city: '', startingPrice: '', startsAt: '', endsAt: '',
}

type DraftsState = {
  /** userId → draftId → черновик. Ключ по пользователю — чтобы в общем браузере не видеть чужие черновики. */
  draftsByUser: Record<string, Record<string, LotDraft>>

  createDraft: (userId: string) => string
  updateDraft: (userId: string, draftId: string, patch: DraftPatch) => void
  removeDraft: (userId: string, draftId: string) => void
}

export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      draftsByUser: {},

      createDraft: (userId) => {
        const now = Date.now()
        const draft: LotDraft = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          car: null,
          carForm: emptyCarForm,
          details: emptyDetails,
          photos: [],
        }

        set((state) => ({
          draftsByUser: {
            ...state.draftsByUser,
            [userId]: { ...state.draftsByUser[userId], [draft.id]: draft },
          },
        }))

        return draft.id
      },

      updateDraft: (userId, draftId, patch) =>
        set((state) => {
          const draft = state.draftsByUser[userId]?.[draftId]
          if (!draft) return state

          const updated: LotDraft = {
            ...draft,
            car: patch.car === undefined ? draft.car : patch.car,
            carForm: { ...draft.carForm, ...patch.carForm },
            details: { ...draft.details, ...patch.details },
            photos: patch.photos ?? draft.photos,
            updatedAt: Date.now(),
          }

          return {
            draftsByUser: {
              ...state.draftsByUser,
              [userId]: { ...state.draftsByUser[userId], [draftId]: updated },
            },
          }
        }),

      removeDraft: (userId, draftId) =>
        set((state) => {
          const rest = Object.fromEntries(
            Object.entries(state.draftsByUser[userId] ?? {}).filter(([id]) => id !== draftId),
          )
          return { draftsByUser: { ...state.draftsByUser, [userId]: rest } }
        }),
    }),
    {
      // persist сам пишет состояние в localStorage при каждом изменении и читает при загрузке
      name: 'autotorg.lot-drafts',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только данные, без функций
      partialize: (state) => ({ draftsByUser: state.draftsByUser }),
      // При изменении формы черновика поднимите версию и опишите migrate, иначе старые черновики сломаются
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Pick<DraftsState, 'draftsByUser'>
        // v1 → v2: появились фото — старым черновикам добавляем пустой список
        if (version < 2) {
          Object.values(state.draftsByUser).forEach((drafts) =>
            Object.values(drafts).forEach((draft) => {
              draft.photos ??= []
            }),
          )
        }
        return state
      },
    },
  ),
)

// Стабильная ссылка: селектор не должен возвращать новый объект на каждый рендер, иначе бесконечный ререндер
const NO_DRAFTS: Record<string, LotDraft> = {}

export const useUserDrafts = (userId: string) =>
  useDraftsStore((state) => state.draftsByUser[userId] ?? NO_DRAFTS)

export const useDraft = (userId: string, draftId: string | undefined) =>
  useDraftsStore((state) => (draftId ? state.draftsByUser[userId]?.[draftId] : undefined))
