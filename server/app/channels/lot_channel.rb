class LotChannel < ApplicationCable::Channel
  def subscribed
    lot = Lot.find_by(id: params[:lot_id])
    return reject unless lot

    stream_for lot
  end
end
