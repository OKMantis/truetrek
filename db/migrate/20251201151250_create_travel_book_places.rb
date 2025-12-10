class CreateTravelBookPlaces < ActiveRecord::Migration[7.2]
  def change
    create_table :travel_book_places do |t|
      t.references :place, null: false, foreign_key: true
      t.references :travel_book, null: false, foreign_key: true

      t.timestamps
    end
  end
end
