class CreateLots < ActiveRecord::Migration[8.1]
  def change
    create_table :lots, id: :uuid do |t|
      t.references :car, null: false, type: :uuid, foreign_key: true
      t.references :leader, type: :uuid, foreign_key: { to_table: :users }
      t.integer :status, null: false, default: 0
      t.bigint :starting_price_cents, null: false
      t.bigint :current_price_cents, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.integer :bid_count, null: false, default: 0

      t.check_constraint "ends_at > starts_at", name: "lots_ends_after_start"
      t.check_constraint "current_price_cents >= starting_price_cents", name: "lots_current_price_not_below_start"
      t.check_constraint "bid_count >= 0", name: "lots_bid_count_non_negative"
      t.check_constraint "starting_price_cents >= 0", name: "lots_starting_price_non_negative"
      t.timestamps
    end

    add_index :lots, [:status, :ends_at]
    add_index :lots, [:status, :starts_at]
    add_index :lots, :car_id, unique: true, where: "status IN (0, 1)", name: "index_lots_on_car_id_open"
  end
end
