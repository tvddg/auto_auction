# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_04_151532) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "bids", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "amount_cents", null: false
    t.datetime "created_at", null: false
    t.uuid "idempotency_key", null: false
    t.uuid "lot_id", null: false
    t.integer "rejection_reason"
    t.integer "seq"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["lot_id", "amount_cents"], name: "index_bids_on_lot_id_and_amount_cents", unique: true, where: "(status = 0)"
    t.index ["lot_id", "seq"], name: "index_bids_on_lot_id_and_seq", unique: true
    t.index ["user_id", "created_at"], name: "index_bids_on_user_id_and_created_at"
    t.index ["user_id", "idempotency_key"], name: "index_bids_on_user_id_and_idempotency_key", unique: true
    t.check_constraint "(status = 1) = (rejection_reason IS NOT NULL)", name: "bids_rejections_are_resoned"
    t.check_constraint "(status = 1) = (seq IS NULL)", name: "bids_rejections_unordered"
    t.check_constraint "amount_cents > 0", name: "bids_amount_positive"
  end

  create_table "cars", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "body_type", null: false
    t.string "brand", null: false
    t.string "city", null: false
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "drive_type", null: false
    t.integer "engine_volume_cc"
    t.integer "fuel_type", null: false
    t.integer "horse_power", null: false
    t.integer "mileage", null: false
    t.string "model", null: false
    t.uuid "seller_id", null: false
    t.integer "transmission", null: false
    t.string "trim"
    t.datetime "updated_at", null: false
    t.string "vin", limit: 17, null: false
    t.integer "year", null: false
    t.index ["brand", "model"], name: "index_cars_on_brand_and_model"
    t.index ["city"], name: "index_cars_on_city"
    t.index ["seller_id"], name: "index_cars_on_seller_id"
    t.index ["vin"], name: "index_cars_on_vin", unique: true
    t.check_constraint "engine_volume_cc >= 500 AND engine_volume_cc <= 10000", name: "cars_engine_volume_range"
    t.check_constraint "horse_power >= 1 AND horse_power <= 2000", name: "cars_horse_power_range"
    t.check_constraint "mileage >= 0", name: "cars_mileage_non_negative"
    t.check_constraint "vin::text ~ '^[A-HJ-NPR-Z0-9]{17}$'::text", name: "cars_vin_format"
    t.check_constraint "year >= 1900 AND year <= 2100", name: "cars_year_range"
  end

  create_table "lots", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "bid_count", default: 0, null: false
    t.uuid "car_id", null: false
    t.datetime "created_at", null: false
    t.bigint "current_price_cents", null: false
    t.datetime "ends_at", null: false
    t.uuid "leader_id"
    t.bigint "starting_price_cents", null: false
    t.datetime "starts_at", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["car_id"], name: "index_lots_on_car_id"
    t.index ["car_id"], name: "index_lots_on_car_id_open", unique: true, where: "(status = ANY (ARRAY[0, 1]))"
    t.index ["leader_id"], name: "index_lots_on_leader_id"
    t.index ["status", "ends_at"], name: "index_lots_on_status_and_ends_at"
    t.index ["status", "starts_at"], name: "index_lots_on_status_and_starts_at"
    t.check_constraint "bid_count >= 0", name: "lots_bid_count_non_negative"
    t.check_constraint "current_price_cents >= starting_price_cents", name: "lots_current_price_not_below_start"
    t.check_constraint "ends_at > starts_at", name: "lots_ends_after_start"
    t.check_constraint "starting_price_cents >= 0", name: "lots_starting_price_non_negative"
  end

  create_table "pending_registrations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "attempts", default: 0, null: false
    t.string "code_digest", null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.datetime "last_sent_at", null: false
    t.string "password_digest", null: false
    t.string "phone", null: false
    t.string "request_ip"
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_pending_registrations_on_expires_at"
    t.index ["phone"], name: "index_pending_registrations_on_phone"
  end

  create_table "refresh_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip"
    t.datetime "last_used_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.uuid "user_id", null: false
    t.index ["token_digest"], name: "index_refresh_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_sessions_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "deposit_cents", default: 0, null: false
    t.string "email", null: false
    t.string "name"
    t.string "password_digest", null: false
    t.string "phone", null: false
    t.datetime "phone_verified_at"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["phone"], name: "index_users_on_phone", unique: true
  end

  add_foreign_key "bids", "lots"
  add_foreign_key "bids", "users"
  add_foreign_key "cars", "users", column: "seller_id"
  add_foreign_key "lots", "cars"
  add_foreign_key "lots", "users", column: "leader_id"
  add_foreign_key "refresh_sessions", "users"
end
