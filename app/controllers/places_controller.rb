class PlacesController < ApplicationController
  before_action :set_place, only: [:show]

  def index
    @city = City.find(params[:city_id])
    @places = policy_scope(@city.places)
    @places = @places.search(params[:query]) if params[:query].present?
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
