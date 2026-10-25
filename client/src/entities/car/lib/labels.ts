import type { BodyType, Car, DriveType, FuelType, Transmission } from '../model/types'

export const bodyTypeLabels: Record<BodyType, string> = {
  sedan: 'Седан',
  hatchback: 'Хэтчбек',
  liftback: 'Лифтбек',
  wagon: 'Универсал',
  coupe: 'Купе',
  convertible: 'Кабриолет',
  suv: 'Внедорожник',
  minivan: 'Минивэн',
  pickup: 'Пикап',
  van: 'Фургон',
}

export const transmissionLabels: Record<Transmission, string> = {
  manual: 'МКПП',
  automatic: 'АКПП',
  robot: 'Робот',
  cvt: 'Вариатор',
}

export const driveTypeLabels: Record<DriveType, string> = {
  fwd: 'Передний',
  rwd: 'Задний',
  awd: 'Полный',
}

export const fuelTypeLabels: Record<FuelType, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  hybrid: 'Гибрид',
  electric: 'Электро',
  lpg: 'Газ',
}

export const formatCarTitle = (car: Pick<Car, 'brand' | 'model' | 'trim'>) =>
  [car.brand, car.model, car.trim].filter(Boolean).join(' ')

/** Короткое описание комплектации: «2019 · АКПП · Бензин · 181 л.с. · 2.5 л». */
export const formatCarSpecs = (car: Car) =>
  [
    car.year,
    transmissionLabels[car.transmission],
    fuelTypeLabels[car.fuelType],
    `${car.horsePower} л.с.`,
    car.engineVolumeCc ? `${(car.engineVolumeCc / 1000).toFixed(1)} л` : null,
  ]
    .filter(Boolean)
    .join(' · ')
