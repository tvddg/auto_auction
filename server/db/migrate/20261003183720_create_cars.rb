class CreateCars < ActiveRecord::Migration[8.1]
  def change
    create_table :cars, id: :uuid do |t|
      t.references :seller, null: false, type: :uuid, foreign_key: { to_table: :users }
      t.string :brand, null: false
      t.string :model, null: false
      t.string :trim
      t.string :color, null: false
      t.integer :year, null: false
      t.integer :body_type, null: false
      t.integer :mileage, null: false
      t.string :vin, null: false, limit: 17
      t.integer :transmission, null: false
      t.integer :drive_type, null: false
      t.integer :fuel_type, null: false
      t.integer :horse_power, null: false
      t.integer :engine_volume_cc
      t.string :city, null: false
      t.text :description

      t.check_constraint "vin ~ '^[A-HJ-NPR-Z0-9]{17}$'", name: "cars_vin_format"
      t.check_constraint "mileage >= 0", name: "cars_mileage_non_negative"
      t.check_constraint "year BETWEEN 1900 AND 2100", name: "cars_year_range"
      t.check_constraint "horse_power BETWEEN 1 AND 2000", name: "cars_horse_power_range"
      t.check_constraint "engine_volume_cc BETWEEN 500 AND 10000", name: "cars_engine_volume_range"
      t.timestamps
    end

    add_index :cars, :vin, unique: true
    add_index :cars, [:brand, :model]
    add_index :cars, :city
  end
end
