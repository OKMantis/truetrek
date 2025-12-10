class CreateTravelBooks < ActiveRecord::Migration[7.2]
  def change
    create_table :travel_books do |t|
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
