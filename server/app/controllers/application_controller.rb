class ApplicationController < ActionController::API
  # Нужен для httpOnly-cookie с refresh-токеном: в API-режиме его нет по умолчанию.
  include ActionController::Cookies
end
