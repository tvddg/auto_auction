# Клиент ждёт camelCase — держим формат ответа в одном месте.
module UserSerializer
  module_function

  def call(user)
    {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      phoneVerified: user.phone_verified?,
      createdAt: user.created_at.iso8601
    }
  end
end
