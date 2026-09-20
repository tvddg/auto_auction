class CreatePendingRegistrations < ActiveRecord::Migration[8.1]
  def change
    create_table :pending_registrations, id: :uuid do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :phone, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_sent_at, null: false
      t.integer :attempts, null: false, default: 0
      t.string :request_ip

      t.timestamps
    end

    add_index :pending_registrations, :phone
    add_index :pending_registrations, :expires_at
  end
end
