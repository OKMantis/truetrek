class City < ApplicationRecord
  has_many :places
  has_one_attached :photo
end
