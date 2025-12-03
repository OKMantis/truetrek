class UsersController < ApplicationController
  def show
    @user = User.find(params[:id])
    authorize @user
    @comments = @user.comments.includes(:place, photos_attachments: :blob).order(created_at: :desc)
    @travel_book = @user.travel_book
    @places_count = @travel_book&.places&.count || 0
  end
end
