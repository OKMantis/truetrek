class CitiesController < ApplicationController
  def index
    @query = params[:query]
    @cities = policy_scope(City).order(:name)

    if @query.present?
      @cities = @cities.search(@query)
      @places = Place.search(@query).includes(:city)
      @comments = Comment.search(@query).includes(:place, :user)
    else
      @places = Place.none
      @comments = Comment.none
    end
  end
end
