module Authentication
  extend ActiveSupport::Concern

  included do
    attr_reader :current_user
  end

  private

  def authenticate!
    @current_user = AccessToken.user_for(bearer_token)
    render_unauthorized if @current_user.nil?
  end

  def bearer_token = request.authorization.to_s[/\ABearer (.+)\z/, 1]
end
