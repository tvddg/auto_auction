export { NewLotPage } from './ui/NewLotPage'
// Шаги — элементы вложенных маршрутов шторки; app берёт их отсюда, чтобы не лезть в features напрямую
export {
  CarCreateStep,
  CarPickStep,
  DetailsStep,
  DraftRoute,
  DraftStart,
  DraftsList,
  PhotosStep,
  ReviewStep,
} from '@/features/lot/new-lot'
