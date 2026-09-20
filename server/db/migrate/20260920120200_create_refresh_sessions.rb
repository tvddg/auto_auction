class CreateRefreshSessions < ActiveRecord::Migration[8.1]
  def change
    # Одна строка — одно устройство. Токен хранится только в виде дайджеста.
    create_table :refresh_sessions, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_used_at
      t.string :user_agent
      t.string :ip

      t.timestamps
    end

    add_index :refresh_sessions, :token_digest, unique: true
  end
end
