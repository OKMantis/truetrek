class CreatePlaces < ActiveRecord::Migration[7.2]
  def change
    create_table :places do |t|
      t.string :title
      t.string :wiki_description
      t.float :longitude
      t.float :latitude
      t.references :city, null: false, foreign_key: true

      t.timestamps
    end
  end
end
