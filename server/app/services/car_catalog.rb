# Поиск по справочнику комплектаций для GET /car — им пользуется шаг выбора машины при создании лота.
# VIN здесь не ищем: он принадлежит конкретному лоту, а не комплектации.
class CarCatalog
  DEFAULT_LIMIT = 20
  MAX_LIMIT = 100
  INTEGER_PARAMS = { limit: 1..MAX_LIMIT, page: 1.. }.freeze

  Page = Data.define(:cars, :total)

  class InvalidParams < StandardError
    attr_reader :details

    def initialize(details)
      @details = details
      super("Проверьте параметры запроса")
    end
  end

  def self.call(...) = new(...).call

  def initialize(params)
    @params = params
  end

  def call
    parse!
    scope = filtered

    Page.new(
      # id в конце — чтобы порядок был однозначным и страницы не перекрывались
      cars: scope.order(:brand, :model, :trim, year: :desc, id: :asc).limit(@limit).offset((@page - 1) * @limit),
      total: scope.count
    )
  end

  private

  def filtered
    return Car.all unless @query

    pattern = "%#{Car.sanitize_sql_like(@query)}%"
    Car.where("concat_ws(' ', cars.brand, cars.model, cars.trim) ILIKE ?", pattern)
  end

  # Параметры приходят строками: приводим к числам и проверяем диапазон, иначе — 422 с подробностями
  def parse!
    details = {}

    integers = INTEGER_PARAMS.to_h do |key, range|
      raw = @params[key]
      next [ key, nil ] if raw.blank?

      value = Integer(raw.to_s, 10, exception: false)
      details[key] = [ "Должно быть целым числом не меньше #{range.begin}#{" и не больше #{range.end}" if range.end}" ] unless value && range.cover?(value)
      [ key, value ]
    end

    raise InvalidParams, details if details.any?

    @limit = integers[:limit] || DEFAULT_LIMIT
    @page = integers[:page] || 1
    @query = @params[:q].to_s.squish.presence
  end
end
