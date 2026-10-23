require "test_helper"

class BidStepTest < ActiveSupport::TestCase
  test "шаг берётся из диапазона, в который попадает цена" do
    assert_equal 500_000, BidStep.step_for(1)
    assert_equal 1_000_000, BidStep.step_for(70_000_000)
    assert_equal 2_500_000, BidStep.step_for(165_000_000)
  end

  test "верхняя граница входит в свой диапазон" do
    assert_equal 500_000, BidStep.step_for(50_000_000)
    assert_equal 1_000_000, BidStep.step_for(50_000_001)
  end

  test "цены выше всех границ попадают в диапазон без верхней границы" do
    assert_equal 5_000_000, BidStep.step_for(300_000_001)
    assert_equal 5_000_000, BidStep.step_for(10**15)
  end

  test "без диапазона для цены сообщает об ошибке настройки" do
    bid_steps(:above).destroy!

    assert_raises(BidStep::NotConfigured) { BidStep.step_for(300_000_001) }
  end

  test "некорректный шаг или граница отклоняются" do
    assert_not BidStep.new(step_cents: 0).valid?
    assert_not BidStep.new(step_cents: 100, upper_bound_cents: 0).valid?
  end

  test "граница не может повторяться, в том числе пустая" do
    assert_not BidStep.new(step_cents: 100, upper_bound_cents: 50_000_000).valid?
    assert_not BidStep.new(step_cents: 100, upper_bound_cents: nil).valid?
  end

  test "база не допускает второй диапазон без верхней границы" do
    assert_raises(ActiveRecord::RecordNotUnique) { BidStep.new(step_cents: 100).save(validate: false) }
  end
end
