class CreateBids < ActiveRecord::Migration[8.1]
  def change
    create_table :bids, id: :uuid do |t|
      t.references :lot, null: false, type: :uuid, foreign_key: true, index: false
      t.references :user, null: false, type: :uuid, foreign_key: true, index: false
      t.bigint :amount_cents, null: false
      t.integer :status, null: false, default: 0
      t.integer :rejection_reason
      t.uuid :idempotency_key, null: false
      t.integer :seq

      t.timestamps

      t.check_constraint "amount_cents > 0", name: "bids_amount_positive"
      t.check_constraint "(status = 1) = (rejection_reason IS NOT NULL)", name: "bids_rejections_are_resoned"
      t.check_constraint "(status = 1) = (seq IS NULL)", name: "bids_rejections_unordered"
    end

    add_index :bids, [:lot_id, :seq], unique: true
    add_index :bids, [:user_id, :idempotency_key], unique: true
    add_index :bids, [:lot_id, :amount_cents], unique: true, where: "status = 0"
    add_index :bids, [:user_id, :created_at]
  end
end
