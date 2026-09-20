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

ActiveRecord::Schema[8.1].define(version: 0) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "ConsumedDish", id: :serial, force: :cascade do |t|
    t.float "calories", null: false
    t.float "carbs", null: false
    t.datetime "created_at", precision: 3, default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.integer "dish_id", null: false
    t.datetime "eaten_at", precision: 3, null: false
    t.float "fats", null: false
    t.integer "grams", null: false
    t.text "meal_type", null: false
    t.float "proteins", null: false
    t.integer "user_id", null: false
    t.index ["user_id", "eaten_at"], name: "user_time_idx"
    t.index ["user_id", "meal_type"], name: "user_meal_idx"
  end

  create_table "Dish", id: :serial, force: :cascade do |t|
    t.integer "calories_per_100g", null: false
    t.float "carbs_per_100g", null: false
    t.datetime "created_at", precision: 3, default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.float "fats_per_100g", null: false
    t.text "image_url"
    t.text "name", null: false
    t.float "proteins_per_100g", null: false
  end

  create_table "User", id: :serial, force: :cascade do |t|
    t.date "birthday", null: false
    t.integer "calories_goal"
    t.datetime "created_at", precision: 3, default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.text "email", null: false
    t.integer "height_cm"
    t.text "name", null: false
    t.text "password_hash", null: false
    t.text "role", null: false
    t.datetime "updated_at", precision: 3, null: false
    t.float "weight_kg"
    t.index ["email"], name: "User_email_key", unique: true
  end

  create_table "_prisma_migrations", id: { type: :string, limit: 36 }, force: :cascade do |t|
    t.integer "applied_steps_count", default: 0, null: false
    t.string "checksum", limit: 64, null: false
    t.timestamptz "finished_at"
    t.text "logs"
    t.string "migration_name", limit: 255, null: false
    t.timestamptz "rolled_back_at"
    t.timestamptz "started_at", default: -> { "now()" }, null: false
  end

  add_foreign_key "ConsumedDish", "Dish", column: "dish_id", name: "ConsumedDish_dish_id_fkey", on_update: :cascade, on_delete: :cascade
  add_foreign_key "ConsumedDish", "User", column: "user_id", name: "ConsumedDish_user_id_fkey", on_update: :cascade, on_delete: :cascade
end
