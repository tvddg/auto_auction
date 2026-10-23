# Три представления лота: запись (ответ на создание и изменение), карточка каталога и страница лота.
module LotSerializer
  GEARS = { "manual" => "МКПП", "automatic" => "АКПП", "robot" => "РКПП", "cvt" => "ВКПП" }.freeze

  module_function

  def call(lot, now: Time.current)
    {
      id: lot.id,
      carId: lot.car_id,
      userId: lot.seller_id,
      vin: lot.vin,
      mileage: lot.mileage,
      color: lot.color,
      city: lot.city,
      status: lot.phase(now),
      startingPriceCents: lot.starting_price_cents,
      currentPriceCents: lot.current_price_cents,
      startsAt: lot.starts_at.iso8601,
      endsAt: lot.ends_at.iso8601,
      bidCount: lot.bid_count
    }
  end

  def card(lot, now: Time.current)
    phase = lot.phase(now)
    payload = {
      status: phase,
      id: lot.id,
      title: lot.car.title,
      # Фото и избранное появятся вместе с Active Storage и FeaturedItems
      imageUrl: nil,
      shortInfo: { year: lot.car.year, mileage: lot.mileage, gear: GEARS[lot.car.transmission] },
      price: lot.current_price_cents,
      betsAmount: lot.bid_count,
      inFeatured: false
    }

    case phase
    when "active" then payload[:remainingTime] = ((lot.ends_at - now) * 1000).floor
    when "upcoming" then payload[:startDate] = lot.starts_at.iso8601
    else payload[:dealDate] = lot.ends_at.iso8601
    end

    payload
  end

  def detail(lot, now: Time.current)
    car = lot.car

    {
      id: lot.id,
      carInfo: {
        brand: car.brand,
        model: car.model,
        trim: car.trim,
        color: lot.color,
        year: car.year,
        bodyType: car.body_type,
        vin: lot.vin,
        mileage: lot.mileage,
        transmission: car.transmission,
        driveType: car.drive_type,
        fuelType: car.fuel_type,
        horsePower: car.horse_power,
        engineVolume: car.engine_volume_cc,
        city: lot.city,
        description: car.description
      },
      sellerInfo: { name: lot.seller.name, phone: lot.seller.phone },
      status: lot.phase(now),
      startingPrice: lot.starting_price_cents,
      currentPrice: lot.current_price_cents,
      startsAt: lot.starts_at.iso8601,
      endsAt: lot.ends_at.iso8601,
      bidCount: lot.bid_count
    }
  end
end
