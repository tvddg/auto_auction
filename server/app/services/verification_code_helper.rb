module VerificationCodeHelper
  LENGTH = 4

  module_function

  def generateCode = SecureRandom.random_number(10**LENGTH).to_s.rjust(LENGTH, "0")

  # Код короткий, поэтому в базе держим HMAC, а не сам код.
  def digestCode(code)
    OpenSSL::HMAC.hexdigest("SHA256", Rails.application.secret_key_base, code.to_s)
  end

  def codeMatches?(digest_value, code)
    ActiveSupport::SecurityUtils.secure_compare(digest_value.to_s, digestCode(code))
  end
  
end
