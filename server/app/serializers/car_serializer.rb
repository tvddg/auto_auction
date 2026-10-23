module CarSerializer
  module_function

  def call(car)
    {
      id: car.id,
      brand: car.brand,
      model: car.model,
      trim: car.trim,
      year: car.year,
      bodyType: car.body_type,
      transmission: car.transmission,
      driveType: car.drive_type,
      fuelType: car.fuel_type,
      horsePower: car.horse_power,
      engineVolumeCc: car.engine_volume_cc,
      description: car.description
    }
  end
end
