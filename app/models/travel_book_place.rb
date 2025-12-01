class TravelBookPlace < ApplicationRecord
  belongs_to :place
  belongs_to :travel_book
end
