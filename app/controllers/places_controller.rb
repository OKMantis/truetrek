class PlacesController < ApplicationController

  def index
    @places = policy_scope(Place)

    @markers = @places.geocoded.map do |plac|
    {
      lat: plac.latitude,
      lng: plac.longitude
        }
    end
  end
end
