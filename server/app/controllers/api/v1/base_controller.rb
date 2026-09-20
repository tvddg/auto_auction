module Api
  module V1
    class BaseController < ApplicationController
      include ApiErrors
      include Authentication
    end
  end
end
