class City < ApplicationRecord
  include PgSearch::Model

  has_many :places
  has_one_attached :photo

  pg_search_scope :search,
    against: [:name],
    using: {
      tsearch: { prefix: true }
    }
end
