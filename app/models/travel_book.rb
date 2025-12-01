class TravelBook < ApplicationRecord
  belongs_to :user
  has_many :places, through: :travel_book_places
end
