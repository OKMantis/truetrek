class PlacesController < ApplicationController
  before_action :set_place, only: [:show]

  def index
    @places = policy_scope(Place)

    @markers = @places.geocoded.map do |plac|
    {
      lat: plac.latitude,
      lng: plac.longitude
        }
    end
  end

  def show
    @comment = Comment.new
  end

  private

  def set_place
    @place = Place.find(params[:id])
    authorize @place
  end

end
