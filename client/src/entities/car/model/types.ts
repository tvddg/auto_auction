export const BODY_TYPES = ['sedan', 'hatchback', 'liftback', 'wagon', 'coupe', 'convertible', 'suv', 'minivan', 'pickup', 'van'] as const
export const TRANSMISSIONS = ['manual', 'automatic', 'robot', 'cvt'] as const
export const DRIVE_TYPES = ['fwd', 'rwd', 'awd'] as const
export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric', 'lpg'] as const

export type BodyType = (typeof BODY_TYPES)[number]
export type Transmission = (typeof TRANSMISSIONS)[number]
export type DriveType = (typeof DRIVE_TYPES)[number]
export type FuelType = (typeof FUEL_TYPES)[number]

/** Комплектация из справочника — ответ GET /car и POST /car. */
export type Car = {
  id: string
  brand: string
  model: string
  trim: string | null
  year: number
  bodyType: BodyType
  transmission: Transmission
  driveType: DriveType
  fuelType: FuelType
  horsePower: number
  engineVolumeCc: number | null
  description: string | null
}

export type CreateCarDto = Omit<Car, 'id'>
