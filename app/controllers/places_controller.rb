class PlacesController < ApplicationController
  def index
    @places = Places.all
  end
end
