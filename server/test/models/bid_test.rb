require "test_helper"

class BidTest < ActiveSupport::TestCase
  BIGINT_MAX = 9_223_372_036_854_775_807

  setup do
    @lot = lots(:camry_active)
  end

  # Следующая ставка в camry_active: в фикстурах уже есть seq 1–3 и сумма до 165 000 000
  def build_bid(**overrides)
    Bid.new({
      lot: @lot,
      user: users(:three),
      amount_cents: 170_000_000,
      status: :accepted,
      seq: 4,
      idempotency_key: SecureRandom.uuid
    }.merge(overrides))
  end

  def build_rejected_bid(**overrides)
    build_bid(status: :rejected, seq: nil, rejection_reason: :amount_too_low, **overrides)
  end

  # --- корректные данные ---

  test "принятая ставка с полными корректными данными сохраняется" do
    bid = build_bid

    assert bid.save, bid.errors.full_messages.to_sentence
    bid.reload
    assert bid.accepted?
    assert_equal 4, bid.seq
    assert_nil bid.rejection_reason
  end

  test "отклонённая ставка с причиной и без номера сохраняется" do
    bid = build_rejected_bid

    assert bid.save, bid.errors.full_messages.to_sentence
    assert bid.reload.rejected_as_amount_too_low?
  end

  test "статус по умолчанию — принята" do
    assert Bid.new.accepted?
  end

  test "фикстуры валидны" do
    Bid.find_each { |bid| assert bid.valid?, "#{bid.status}: #{bid.errors.full_messages.to_sentence}" }
  end

  # --- неполные данные ---

  test "без обязательных полей ставка не сохраняется" do
    bid = Bid.new

    assert_not bid.save
    %i[lot user amount_cents idempotency_key seq].each do |field|
      assert bid.errors.key?(field), "нет ошибки для #{field}"
    end
  end

  test "принятая ставка без номера отклоняется" do
    bid = build_bid(seq: nil)

    assert_not bid.valid?
    assert bid.errors.key?(:seq)
  end

  test "отклонённая ставка без причины отклоняется" do
    bid = build_rejected_bid(rejection_reason: nil)

    assert_not bid.valid?
    assert bid.errors.key?(:rejection_reason)
  end

  # --- граничные значения суммы ---

  test "минимальная сумма — 1 копейка" do
    assert build_bid(amount_cents: 1).valid?
  end

  test "нулевая, отрицательная и дробная суммы отклоняются" do
    [0, -1, 1.5, "много"].each do |amount|
      bid = build_bid(amount_cents: amount)

      assert_not bid.valid?, "сумма #{amount.inspect} прошла валидацию"
      assert bid.errors.key?(:amount_cents)
    end
  end

  test "максимальная сумма bigint сохраняется" do
    bid = build_bid(amount_cents: BIGINT_MAX)

    assert bid.save, bid.errors.full_messages.to_sentence
    assert_equal BIGINT_MAX, bid.reload.amount_cents
  end

  # --- граничные значения номера ---

  test "номер 1 допустим в лоте без ставок" do
    assert build_bid(lot: lots(:model_3_upcoming), seq: 1).valid?
  end

  test "нулевой, отрицательный и дробный номера отклоняются" do
    [0, -1, 4.5].each do |seq|
      bid = build_bid(seq: seq)

      assert_not bid.valid?, "номер #{seq.inspect} прошёл валидацию"
      assert bid.errors.key?(:seq)
    end
  end

  test "номер уникален в пределах лота" do
    bid = build_bid(seq: bids(:camry_third).seq)

    assert_not bid.valid?
    assert bid.errors.key?(:seq)
  end

  test "тот же номер в другом лоте допустим" do
    assert build_bid(lot: lots(:model_3_upcoming), seq: bids(:camry_first).seq).valid?
  end

  test "отклонённая ставка с номером отклоняется" do
    bid = build_rejected_bid(seq: 4)

    assert_not bid.valid?
    assert bid.errors.key?(:seq)
  end

  # --- согласованность статуса и причины ---

  test "принятая ставка с причиной отказа отклоняется" do
    bid = build_bid(rejection_reason: :amount_too_low)

    assert_not bid.valid?
    assert bid.errors.key?(:rejection_reason)
  end

  test "неизвестные статус и причина отклоняются" do
    bid = build_rejected_bid(rejection_reason: :bad_mood)
    other = build_bid(status: :pending)

    assert_not bid.valid?
    assert bid.errors.key?(:rejection_reason)
    assert_not other.valid?
    assert other.errors.key?(:status)
  end

  # --- повторы суммы ---

  test "принятая ставка с уже принятой в лоте суммой отклоняется" do
    bid = build_bid(amount_cents: bids(:camry_third).amount_cents)

    assert_not bid.valid?
    assert bid.errors.key?(:amount_cents)
  end

  test "отклонённая ставка может повторять принятую сумму" do
    assert build_rejected_bid(amount_cents: bids(:camry_third).amount_cents).save
  end

  test "та же сумма в другом лоте допустима" do
    assert build_bid(lot: lots(:model_3_upcoming), seq: 1, amount_cents: bids(:camry_third).amount_cents).valid?
  end

  # --- ключ идемпотентности ---

  test "повтор ключа тем же пользователем отклоняется" do
    original = bids(:camry_second)
    bid = build_bid(user: original.user, idempotency_key: original.idempotency_key)

    assert_not bid.valid?
    assert bid.errors.key?(:idempotency_key)
  end

  test "тот же ключ у другого пользователя допустим" do
    assert build_bid(user: users(:two), idempotency_key: bids(:camry_second).idempotency_key).valid?
  end

  test "повтор ключа отклоняется и для отклонённой ставки" do
    original = bids(:camry_too_low)
    bid = build_rejected_bid(user: original.user, idempotency_key: original.idempotency_key)

    assert_not bid.valid?
    assert bid.errors.key?(:idempotency_key)
  end

  # --- догрузка при реконнекте ---

  test "since отдаёт только принятые ставки после номера по порядку" do
    assert_equal [2, 3], @lot.bids.since(1).pluck(:seq)
  end

  test "since с нулём или nil отдаёт всю историю" do
    assert_equal [1, 2, 3], @lot.bids.since(0).pluck(:seq)
    assert_equal [1, 2, 3], @lot.bids.since(nil).pluck(:seq)
  end

  test "since с последним номером отдаёт пустой список" do
    assert_empty @lot.bids.since(3)
  end

  # --- ограничения базы в обход валидаций ---

  test "база отклоняет нулевую сумму" do
    assert_check_violation "bids_amount_positive", build_bid(amount_cents: 0)
  end

  test "база отклоняет отклонённую ставку без причины" do
    assert_check_violation "bids_rejections_are_resoned", build_rejected_bid(rejection_reason: nil)
  end

  test "база отклоняет принятую ставку с причиной" do
    assert_check_violation "bids_rejections_are_resoned", build_bid(rejection_reason: :amount_too_low)
  end

  test "база отклоняет отклонённую ставку с номером" do
    assert_check_violation "bids_rejections_unordered", build_rejected_bid(seq: 4)
  end

  test "база отклоняет принятую ставку без номера" do
    assert_check_violation "bids_rejections_unordered", build_bid(seq: nil)
  end

  test "база отклоняет повтор номера в лоте" do
    assert_raises(ActiveRecord::RecordNotUnique) { build_bid(seq: 3).save(validate: false) }
  end

  test "база отклоняет повтор принятой суммы в лоте" do
    assert_raises(ActiveRecord::RecordNotUnique) { build_bid(amount_cents: 165_000_000).save(validate: false) }
  end

  test "база допускает повтор суммы у отклонённой ставки" do
    assert build_rejected_bid(amount_cents: 165_000_000).save(validate: false)
  end

  test "база отклоняет повтор ключа пользователем" do
    original = bids(:camry_second)

    assert_raises(ActiveRecord::RecordNotUnique) do
      build_bid(user: original.user, idempotency_key: original.idempotency_key).save(validate: false)
    end
  end

  test "база отклоняет несуществующий лот" do
    bid = build_bid
    bid.lot_id = SecureRandom.uuid

    assert_raises(ActiveRecord::InvalidForeignKey) { bid.save(validate: false) }
  end

  test "база отклоняет сумму больше bigint" do
    assert_raises(ActiveModel::RangeError) { build_bid(amount_cents: BIGINT_MAX + 1).save(validate: false) }
  end

  private

  def assert_check_violation(constraint, bid)
    error = assert_raises(ActiveRecord::CheckViolation) { bid.save(validate: false) }
    assert_includes error.message, constraint
  end
end
