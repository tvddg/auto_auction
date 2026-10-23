class MoveListingFieldsFromCarsToLots < ActiveRecord::Migration[8.1]
  MOVED_COLUMNS = %i[seller_id vin mileage color city].freeze
  CONFIGURATION_COLUMNS = %i[brand model trim year body_type transmission drive_type fuel_type horse_power engine_volume_cc].freeze

  def up
    add_reference :lots, :seller, type: :uuid, foreign_key: { to_table: :users }
    add_column :lots, :vin, :string, limit: 17
    add_column :lots, :mileage, :integer
    add_column :lots, :color, :string
    add_column :lots, :city, :string

    execute <<~SQL
      UPDATE lots
      SET seller_id = cars.seller_id, vin = cars.vin, mileage = cars.mileage, color = cars.color, city = cars.city
      FROM cars
      WHERE cars.id = lots.car_id
    SQL

    MOVED_COLUMNS.each { |column| change_column_null :lots, column, false }

    add_check_constraint :lots, "vin ~ '^[A-HJ-NPR-Z0-9]{17}$'", name: "lots_vin_format"
    add_check_constraint :lots, "mileage >= 0", name: "lots_mileage_non_negative"

    # Одна комплектация теперь может продаваться в нескольких лотах сразу,
    # поэтому «один открытый лот» ограничиваем по VIN, а не по машине
    remove_index :lots, name: "index_lots_on_car_id_open"
    add_index :lots, :vin, unique: true, where: "status IN (0, 1)", name: "index_lots_on_vin_open"
    add_index :lots, :city

    remove_check_constraint :cars, name: "cars_vin_format"
    remove_check_constraint :cars, name: "cars_mileage_non_negative"
    remove_index :cars, :vin
    remove_index :cars, :city
    remove_index :cars, %i[brand model]
    remove_reference :cars, :seller, type: :uuid, foreign_key: { to_table: :users }
    remove_column :cars, :vin
    remove_column :cars, :mileage
    remove_column :cars, :color
    remove_column :cars, :city

    # Покрывает и прежний поиск по [brand, model]: это префикс индекса
    add_index :cars, CONFIGURATION_COLUMNS, unique: true, nulls_not_distinct: true, name: "index_cars_on_configuration"
  end

  # Возвращает поля машинам из их последнего лота. Если у какой-то машины лотов нет,
  # NOT NULL не выставится и откат остановится целиком — данные при этом не теряются.
  def down
    remove_index :cars, name: "index_cars_on_configuration"

    add_reference :cars, :seller, type: :uuid, foreign_key: { to_table: :users }
    add_column :cars, :vin, :string, limit: 17
    add_column :cars, :mileage, :integer
    add_column :cars, :color, :string
    add_column :cars, :city, :string

    execute <<~SQL
      UPDATE cars
      SET seller_id = latest.seller_id, vin = latest.vin, mileage = latest.mileage, color = latest.color, city = latest.city
      FROM (
        SELECT DISTINCT ON (car_id) car_id, seller_id, vin, mileage, color, city
        FROM lots
        ORDER BY car_id, created_at DESC
      ) AS latest
      WHERE latest.car_id = cars.id
    SQL

    MOVED_COLUMNS.each { |column| change_column_null :cars, column, false }

    add_check_constraint :cars, "vin ~ '^[A-HJ-NPR-Z0-9]{17}$'", name: "cars_vin_format"
    add_check_constraint :cars, "mileage >= 0", name: "cars_mileage_non_negative"
    add_index :cars, :vin, unique: true
    add_index :cars, :city
    add_index :cars, %i[brand model]

    remove_index :lots, name: "index_lots_on_vin_open"
    remove_index :lots, :city
    add_index :lots, :car_id, unique: true, where: "status IN (0, 1)", name: "index_lots_on_car_id_open"

    remove_check_constraint :lots, name: "lots_vin_format"
    remove_check_constraint :lots, name: "lots_mileage_non_negative"
    remove_reference :lots, :seller, type: :uuid, foreign_key: { to_table: :users }
    remove_column :lots, :vin
    remove_column :lots, :mileage
    remove_column :lots, :color
    remove_column :lots, :city
  end
end
