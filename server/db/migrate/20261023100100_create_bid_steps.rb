class CreateBidSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :bid_steps, id: :uuid do |t|
      t.bigint :upper_bound_cents
      t.bigint :step_cents, null: false

      t.timestamps

      t.check_constraint "upper_bound_cents > 0", name: "bid_steps_upper_bound_positive"
      t.check_constraint "step_cents > 0", name: "bid_steps_step_positive"
    end

    add_index :bid_steps, :upper_bound_cents, unique: true, nulls_not_distinct: true
  end
end
