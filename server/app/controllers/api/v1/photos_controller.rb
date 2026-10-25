module Api
  module V1
    # Загрузка фото для черновика лота. Возвращает signed_id — его клиент передаёт в POST /lot (photoIds).
    class PhotosController < BaseController
      before_action :authenticate!

      rate_limit to: 60, within: 1.minute,
                 by: -> { current_user&.id || request.remote_ip },
                 with: -> { render_too_many_requests("Слишком много загрузок. Попробуйте через минуту") }

      rescue_from PhotoUpload::Invalid do |error|
        render_error(:unprocessable_content, "validation_error", error.message, details: { file: [ error.message ] })
      end

      # POST /api/v1/photo (multipart/form-data, поле file)
      def create
        blob = PhotoUpload.call(file: params[:file], user: current_user)

        render json: { signedId: blob.signed_id, url: PhotoPaths.card(blob) }, status: :created
      end
    end
  end
end
