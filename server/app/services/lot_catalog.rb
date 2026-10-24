# Каталог лотов для GET /lot: фильтры, поиск, сортировка и пагинация.
# Снятые с торгов лоты в каталог не попадают.
class LotCatalog
  DEFAULT_LIMIT = 20
  MAX_LIMIT = 100
  STATUSES = %w[upcoming active finished sold unsold].freeze
  SORT_COLUMNS = { "date" => "lots.starts_at", "cost" => "lots.current_price_cents", "year" => "cars.year" }.freeze
  ORDERS = %w[asc desc].freeze
  INTEGER_PARAMS = { limit: 1..MAX_LIMIT, page: 1.., minYear: 0.., maxYear: 0.., minPrice: 0.., maxPrice: 0.. }.freeze

  Page = Data.define(:lots, :total)

  class InvalidParams < StandardError
    attr_reader :details

    def initialize(details)
      @details = details
      super("Проверьте параметры запроса")
    end
  end

  def self.call(...) = new(...).call

  def initialize(params, now: Time.current)
    @params = params
    @now = now
  end

  def call
    parse!
    scope = filtered

    Page.new(
      lots: scope.includes(:car)
        .order(Arel.sql("#{SORT_COLUMNS.fetch(@sort)} #{@order.upcase}"), "lots.id")
        .limit(@limit)
        .offset((@page - 1) * @limit),
      total: scope.count
    )
  end

  private

  def filtered
    scope = Lot.joins(:car).where.not(status: :cancelled)
    scope = scope.merge(Lot.in_phase(@status, @now)) if @status
    scope = scope.where("LOWER(cars.brand) IN (?)", @brands) if @brands.any?
    scope = scope.where(cars: { year: @integers[:minYear].. }) if @integers[:minYear]
    scope = scope.where(cars: { year: ..@integers[:maxYear] }) if @integers[:maxYear]
    scope = scope.where(current_price_cents: @integers[:minPrice]..) if @integers[:minPrice]
    scope = scope.where(current_price_cents: ..@integers[:maxPrice]) if @integers[:maxPrice]
    if @query
      pattern = "%#{Lot.sanitize_sql_like(@query)}%"
      scope = scope.where("concat_ws(' ', cars.brand, cars.model, cars.trim) ILIKE :pattern OR lots.vin ILIKE :pattern", pattern:)
    end
    scope
  end

  def parse!
    details = {}

    @integers = INTEGER_PARAMS.to_h do |key, range|
      raw = @params[key]
      next [ key, nil ] if raw.blank?

      value = Integer(raw.to_s, 10, exception: false)
      details[key] = [ "Должно быть целым числом не меньше #{range.begin}#{" и не больше #{range.end}" if range.end}" ] unless value && range.cover?(value)
      [ key, value ]
    end

    @status = @params[:status].presence
    details[:status] = [ "Допустимые значения: #{STATUSES.join(", ")}" ] if @status && !STATUSES.include?(@status)

    @sort = @params[:sort].presence || "date"
    details[:sort] = [ "Допустимые значения: #{SORT_COLUMNS.keys.join(", ")}" ] unless SORT_COLUMNS.key?(@sort)

    @order = @params[:order].presence || "desc"
    details[:order] = [ "Допустимые значения: #{ORDERS.join(", ")}" ] unless ORDERS.include?(@order)

    raise InvalidParams, details if details.any?

    @limit = @integers[:limit] || DEFAULT_LIMIT
    @page = @integers[:page] || 1
    @brands = Array(@params[:brands]).flat_map { |value| value.to_s.split(",") }.map { |brand| brand.squish.downcase }.compact_blank
    @query = @params[:q].to_s.squish.presence
  end
end
