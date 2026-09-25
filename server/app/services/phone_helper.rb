module PhoneHelper
    FORMAT = /\A\+7\d{10}\z/

    module_function

    def normalizePhone(value)
        digits = value.to_s.gsub(/\D/, "")
        return nil if digits.blank?

        digits = "7#{digits[1..]}" if digits.start_with?("8")
        digits = "7#{digits}" if digits.length == 10

        "+#{digits}"
    end

    def phoneValid?(value) = FORMAT.match?(value.to_s)
end
