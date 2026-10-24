import type { LotCardDto } from '@/entities/lot'

import type { LotCardProps } from '../ui/LotCard'

/** API отдаёт цены в копейках и даты строками, карточка ждёт рубли и Date. */
export const toLotCardProps = (dto: LotCardDto): LotCardProps => {
  const base = {
    id: dto.id,
    title: dto.title,
    imageUrl: dto.imageUrl,
    shortInfo: dto.shortInfo,
    price: Math.round(dto.price / 100),
    betsAmount: dto.betsAmount,
    inFeatured: dto.inFeatured,
  }

  switch (dto.status) {
    case 'active':
      return { ...base, status: 'active', remainingTime: dto.remainingTime }
    case 'upcoming':
      return { ...base, status: 'upcoming', startDate: new Date(dto.startDate) }
    case 'sold':
    case 'unsold':
      return { ...base, status: dto.status, dealDate: new Date(dto.dealDate) }
  }
}
