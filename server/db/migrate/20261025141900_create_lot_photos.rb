# Фото лота. Сам файл — во вложении Active Storage (has_one_attached :image),
# а эта таблица задаёт принадлежность лоту и порядок: position 0 — обложка в каталоге.
# Порядок хранится здесь, потому что у has_many_attached его нет, а массив id в lots
# не даёт внешних ключей и дублирует связь из active_storage_attachments.
class CreateLotPhotos < ActiveRecord::Migration[8.1]
  def change
    create_table :lot_photos, id: :uuid do |t|
      # Удалили лот — удаляются и строки фото; сами файлы удаляет колбэк модели (purge_later)
      t.references :lot, null: false, type: :uuid, foreign_key: { on_delete: :cascade }, index: false
      t.integer :position, null: false

      t.timestamps

      t.check_constraint "position >= 0", name: "lot_photos_position_non_negative"
    end

    # Покрывает и выборку фото лота по порядку, и запрещает две фотографии на одной позиции
    add_index :lot_photos, %i[lot_id position], unique: true
  end
end
