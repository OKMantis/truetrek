class Places::AutocompleteController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  skip_after_action :verify_policy_scoped

  def index
    query = params[:query].to_s.strip
    latitude = params[:latitude].to_f
    longitude = params[:longitude].to_f

    if query.blank?
      render json: { suggestions: [] }
      return
    end

    begin
      # If we have coordinates, prioritize nearby places
      if latitude.nonzero? && longitude.nonzero?
        # Get nearby places within 1km of the location
        places = Place.near([latitude, longitude], 1, units: :km)
                      .where("LOWER(title) LIKE ?", "%#{query.downcase}%")
                      .limit(5)
                      .pluck(:title, :address, :latitude, :longitude)
      else
        # No coordinates, search all places
        places = Place.where("LOWER(title) LIKE ?", "%#{query.downcase}%")
                      .limit(5)
                      .pluck(:title, :address, :latitude, :longitude)
      end

      suggestions = places.map do |title, address, lat, lng|
        {
          title: title,
          address: address,
          latitude: lat,
          longitude: lng
        }
      end

      render json: { suggestions: suggestions }
    rescue StandardError => e
      Rails.logger.error "Autocomplete error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { suggestions: [] }, status: :ok
    end
  end
end
