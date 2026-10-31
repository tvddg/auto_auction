class CatalogChannel < ApplicationCable::Channel
  def subscribed
    stream_from "lots"
  end
end
