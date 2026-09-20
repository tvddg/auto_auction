module SmsDelivery
  module_function

  # TODO: подключить СМС-провайдера. Пока в dev/test код уходит в лог.
  def call(phone:, code:)
    if Rails.env.production?
      Rails.logger.error("[sms] провайдер не подключён, код для #{phone} не отправлен")
      return false
    end

    Rails.logger.info("[sms] код подтверждения для #{phone}: #{code}")
    true
  end
end
