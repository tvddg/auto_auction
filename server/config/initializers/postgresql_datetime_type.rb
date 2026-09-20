# Время храним с зоной, как в схеме БД (timestamptz).
ActiveSupport.on_load(:active_record_postgresqladapter) do
  self.datetime_type = :timestamptz
end
